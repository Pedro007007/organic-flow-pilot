import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { rows, date } = await req.json();

    // rows: Array of { page, query, clicks, impressions, ctr, position }
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "rows array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshotDate = date || new Date().toISOString().split("T")[0];

    // Aggregate totals
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalPosition = 0;

    for (const row of rows) {
      totalClicks += row.clicks || 0;
      totalImpressions += row.impressions || 0;
      totalPosition += row.position || 0;
    }

    const avgPosition = rows.length > 0 ? (totalPosition / rows.length).toFixed(1) : "0";
    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0";

    // Upsert performance snapshots
    const snapshots = [
      { label: "Total Impressions", value: totalImpressions.toLocaleString(), change: 0, change_label: "vs prev period" },
      { label: "Total Clicks", value: totalClicks.toLocaleString(), change: 0, change_label: "vs prev period" },
      { label: "Avg Position", value: avgPosition, change: 0, change_label: "vs prev period" },
      { label: "Avg CTR", value: `${avgCtr}%`, change: 0, change_label: "vs prev period" },
    ];

    const inserts = snapshots.map((s) => ({
      user_id: user.id,
      label: s.label,
      value: s.value,
      change: s.change,
      change_label: s.change_label,
      snapshot_date: snapshotDate,
    }));

    const { error: snapError } = await supabase.from("performance_snapshots").insert(inserts);
    if (snapError) throw snapError;

    // Also upsert per-page data as keyword rows if query is present
    const keywordInserts = rows
      .filter((r: any) => r.query)
      .map((r: any) => ({
        user_id: user.id,
        keyword: r.query,
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
        search_intent: "informational",
        opportunity: r.position <= 10 ? "low" : r.position <= 30 ? "medium" : "high",
        content_type: "blog",
      }));

    if (keywordInserts.length > 0) {
      const { error: kwError } = await supabase.from("keywords").insert(keywordInserts);
      if (kwError) throw kwError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        snapshots_created: inserts.length,
        keywords_created: keywordInserts.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("gsc-ingest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
