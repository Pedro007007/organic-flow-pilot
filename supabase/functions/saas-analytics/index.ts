import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    // Check admin role
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .limit(1);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch all subscriptions (active, canceled, past_due)
    const allSubs: any[] = [];
    for await (const sub of stripe.subscriptions.list({ limit: 100, expand: ["data.customer"] })) {
      allSubs.push(sub);
    }

    // Fetch canceled subscriptions from last 90 days
    const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 86400;
    const canceledSubs: any[] = [];
    for await (const sub of stripe.subscriptions.list({ status: "canceled", limit: 100, created: { gte: ninetyDaysAgo } })) {
      canceledSubs.push(sub);
    }

    // Calculate MRR from active subscriptions
    const activeSubs = allSubs.filter(s => s.status === "active");
    let mrr = 0;
    const planBreakdown: Record<string, { count: number; mrr: number; name: string }> = {};

    for (const sub of activeSubs) {
      const item = sub.items.data[0];
      if (!item) continue;
      const amount = item.price.unit_amount || 0;
      const interval = item.price.recurring?.interval;
      let monthlyAmount = amount;
      if (interval === "year") monthlyAmount = amount / 12;
      else if (interval === "week") monthlyAmount = amount * 4.33;
      else if (interval === "day") monthlyAmount = amount * 30;

      mrr += monthlyAmount;

      const prodId = typeof item.price.product === "string" ? item.price.product : item.price.product?.id || "unknown";
      if (!planBreakdown[prodId]) {
        planBreakdown[prodId] = { count: 0, mrr: 0, name: prodId };
      }
      planBreakdown[prodId].count += 1;
      planBreakdown[prodId].mrr += monthlyAmount;
    }

    // Resolve product names
    for (const key of Object.keys(planBreakdown)) {
      try {
        const product = await stripe.products.retrieve(key);
        planBreakdown[key].name = product.name;
      } catch {
        // keep product ID as fallback
      }
    }

    const mrrDollars = mrr / 100;
    const arr = mrrDollars * 12;

    // Total revenue (all-time) from Stripe balance transactions
    let totalRevenue = 0;
    try {
      const charges: any[] = [];
      for await (const charge of stripe.charges.list({ limit: 100 })) {
        if (charge.paid && !charge.refunded) {
          totalRevenue += charge.amount;
        }
      }
    } catch (_e) {
      // fallback: estimate from current data
    }
    const totalRevenueDollars = totalRevenue / 100;

    // ARPU (Average Revenue Per User)
    const arpu = activeSubs.length > 0 ? mrrDollars / activeSubs.length : 0;

    // Churn: canceled in last 30 days vs active at start of period
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
    const recentCanceled = canceledSubs.filter(s => (s.canceled_at || 0) >= thirtyDaysAgo).length;
    const totalAtStart = activeSubs.length + recentCanceled;
    const churnRate = totalAtStart > 0 ? (recentCanceled / totalAtStart) * 100 : 0;

    // LTV estimate: average revenue per customer / churn rate
    const avgRevenuePerCustomer = activeSubs.length > 0 ? mrrDollars / activeSubs.length : 0;
    const monthlyChurnDecimal = churnRate / 100;
    const ltv = monthlyChurnDecimal > 0 ? avgRevenuePerCustomer / monthlyChurnDecimal : avgRevenuePerCustomer * 24;

    // Build subscriber list with details
    const subscribers = activeSubs.map(sub => {
      const customer = sub.customer;
      const item = sub.items.data[0];
      return {
        id: sub.id,
        customer_email: typeof customer === "object" ? customer.email : null,
        customer_name: typeof customer === "object" ? customer.name : null,
        status: sub.status,
        plan: item?.price?.product || "unknown",
        amount: (item?.price?.unit_amount || 0) / 100,
        interval: item?.price?.recurring?.interval || "month",
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        created: new Date(sub.created * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      };
    });

    // Monthly growth data (last 12 months)
    const growthData: { month: string; newSubs: number; canceled: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime() / 1000;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const newInMonth = allSubs.filter(s => s.created >= monthStart && s.created < monthEnd).length;
      const canceledInMonth = canceledSubs.filter(s => (s.canceled_at || 0) >= monthStart && (s.canceled_at || 0) < monthEnd).length;

      growthData.push({ month: label, newSubs: newInMonth, canceled: canceledInMonth });
    }

    const planBreakdownArray = Object.values(planBreakdown).map(p => ({
      ...p,
      mrr: p.mrr / 100,
    }));

    return new Response(JSON.stringify({
      mrr: mrrDollars,
      arr,
      total_revenue: totalRevenueDollars,
      arpu: Math.round(arpu * 100) / 100,
      active_subscriptions: activeSubs.length,
      churn_rate: Math.round(churnRate * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
      recent_canceled: recentCanceled,
      plan_breakdown: planBreakdownArray,
      growth_data: growthData,
      subscribers,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message === "Admin access required" ? 403 : 500,
    });
  }
});
