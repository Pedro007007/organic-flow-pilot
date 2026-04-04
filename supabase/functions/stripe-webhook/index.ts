import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "Searchera <noreply@searchera.io>";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured, skipping email");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend error: ${res.status} ${err}`);
    }
  } catch (e) {
    console.error("Email send failed:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");

  // If called with webhook signature, process as webhook
  // Otherwise process as manual trigger from admin
  const body = await req.text();

  let event: Stripe.Event;

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (signature && webhookSecret) {
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    // Manual invocation — parse body as JSON event
    try {
      event = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if (customer.deleted) break;
        const email = customer.email;
        if (email) {
          await sendEmail(
            email,
            "🎉 Welcome to Searchera — Your Subscription is Active!",
            `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h1 style="color:#10b981;font-size:24px;">Welcome to Searchera!</h1>
              <p>Hi ${customer.name || "there"},</p>
              <p>Your subscription is now <strong>active</strong>. You have full access to all features in your plan.</p>
              <p>Get started by visiting your <a href="https://organic-flow-pilot.lovable.app/dashboard" style="color:#6366f1;">dashboard</a>.</p>
              <p style="color:#6b7280;font-size:12px;margin-top:30px;">— The Searchera Team</p>
            </div>`
          );

          // Create in-app notification
          const { data: users } = await supabase.auth.admin.listUsers();
          const matchedUser = users?.users?.find(u => u.email === email);
          if (matchedUser) {
            await supabase.from("notifications").insert({
              user_id: matchedUser.id,
              type: "success",
              title: "Subscription Activated",
              message: "Welcome! Your subscription is now active.",
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const prevSub = event.data.previous_attributes as any;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if (customer.deleted) break;
        const email = customer.email;

        // Detect plan change
        if (prevSub?.items && email) {
          const newProd = sub.items.data[0]?.price?.product;
          let prodName = "your new plan";
          if (typeof newProd === "string") {
            try {
              const p = await stripe.products.retrieve(newProd);
              prodName = p.name;
            } catch {}
          }

          await sendEmail(
            email,
            "📋 Your Searchera Plan Has Been Updated",
            `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h1 style="color:#3b82f6;font-size:24px;">Plan Updated</h1>
              <p>Hi ${customer.name || "there"},</p>
              <p>Your subscription has been updated to <strong>${prodName}</strong>.</p>
              <p>The changes are effective immediately. Visit your <a href="https://organic-flow-pilot.lovable.app/dashboard" style="color:#6366f1;">dashboard</a> to explore your updated features.</p>
              <p style="color:#6b7280;font-size:12px;margin-top:30px;">— The Searchera Team</p>
            </div>`
          );
        }

        // Detect cancellation scheduled
        if (sub.cancel_at_period_end && email) {
          await sendEmail(
            email,
            "😢 Your Searchera Subscription Will Cancel Soon",
            `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h1 style="color:#f59e0b;font-size:24px;">Cancellation Scheduled</h1>
              <p>Hi ${customer.name || "there"},</p>
              <p>Your subscription is set to cancel at the end of the current billing period on <strong>${new Date(sub.current_period_end * 1000).toLocaleDateString()}</strong>.</p>
              <p>Changed your mind? You can reactivate anytime from your <a href="https://organic-flow-pilot.lovable.app/pricing" style="color:#6366f1;">account</a>.</p>
              <p style="color:#6b7280;font-size:12px;margin-top:30px;">— The Searchera Team</p>
            </div>`
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if (customer.deleted) break;
        const email = customer.email;
        if (email) {
          await sendEmail(
            email,
            "Your Searchera Subscription Has Ended",
            `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h1 style="color:#ef4444;font-size:24px;">Subscription Ended</h1>
              <p>Hi ${customer.name || "there"},</p>
              <p>Your subscription has been cancelled. Your access has been suspended until you resubscribe.</p>
              <p>We'd love to have you back. <a href="https://organic-flow-pilot.lovable.app/pricing" style="color:#6366f1;">Resubscribe anytime</a>.</p>
              <p style="color:#6b7280;font-size:12px;margin-top:30px;">— The Searchera Team</p>
            </div>`
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerData = invoice.customer
          ? await stripe.customers.retrieve(invoice.customer as string)
          : null;
        if (customerData && !customerData.deleted && customerData.email) {
          await sendEmail(
            customerData.email,
            "⚠️ Payment Failed — Action Required",
            `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h1 style="color:#ef4444;font-size:24px;">Payment Failed</h1>
              <p>Hi ${customerData.name || "there"},</p>
              <p>We were unable to process your payment of <strong>$${((invoice.amount_due || 0) / 100).toFixed(2)}</strong>.</p>
              <p>Please update your payment method to avoid service interruption:</p>
              <p><a href="https://organic-flow-pilot.lovable.app/pricing" style="color:#6366f1;font-weight:bold;">Update Payment Method →</a></p>
              <p style="color:#6b7280;font-size:12px;margin-top:30px;">— The Searchera Team</p>
            </div>`
          );
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Webhook handler error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
