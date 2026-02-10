import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

function getOAuthConfig() {
  const clientId = Deno.env.get("GSC_CLIENT_ID");
  const clientSecret = Deno.env.get("GSC_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const { user, supabase } = auth;

    const { action, code, redirect_uri } = await req.json();

    const oauthConfig = getOAuthConfig();

    // ── get_auth_url ──
    if (action === "get_auth_url") {
      if (!oauthConfig) return jsonResponse({ error: "GSC credentials not configured" }, 400);
      if (!redirect_uri) return jsonResponse({ error: "redirect_uri required" }, 400);

      const params = new URLSearchParams({
        client_id: oauthConfig.clientId,
        redirect_uri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/webmasters.readonly",
        access_type: "offline",
        prompt: "consent",
      });

      return jsonResponse({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    // ── exchange_code ──
    if (action === "exchange_code") {
      if (!oauthConfig) return jsonResponse({ error: "GSC credentials not configured" }, 400);
      if (!code || !redirect_uri) return jsonResponse({ error: "code and redirect_uri required" }, 400);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) return jsonResponse({ error: tokenData.error_description || tokenData.error }, 400);

      // Get the list of sites to store the first one (user can change later)
      let siteUrl: string | null = null;
      try {
        const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const sitesData = await sitesRes.json();
        siteUrl = sitesData.siteEntry?.[0]?.siteUrl || null;
      } catch { /* ignore */ }

      // Delete existing connection for user, then insert new one
      await supabase.from("gsc_connections").delete().eq("user_id", user.id);

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const { error: insertError } = await supabase.from("gsc_connections").insert({
        user_id: user.id,
        refresh_token: tokenData.refresh_token,
        access_token: tokenData.access_token,
        token_expires_at: expiresAt,
        site_url: siteUrl,
      });

      if (insertError) throw insertError;

      return jsonResponse({ success: true, site_url: siteUrl });
    }

    // ── sync ──
    if (action === "sync") {
      if (!oauthConfig) return jsonResponse({ error: "GSC credentials not configured" }, 400);

      const { data: conn } = await supabase
        .from("gsc_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!conn) return jsonResponse({ error: "No GSC connection found" }, 400);

      // Refresh access token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          refresh_token: conn.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) return jsonResponse({ error: "Token refresh failed: " + tokenData.error }, 400);

      const accessToken = tokenData.access_token;

      // Update cached access token
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;
      await supabase
        .from("gsc_connections")
        .update({ access_token: accessToken, token_expires_at: expiresAt })
        .eq("user_id", user.id);

      if (!conn.site_url) return jsonResponse({ error: "No site URL configured" }, 400);

      // Fetch last 7 days of data from GSC API
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

      const gscRes = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(conn.site_url)}/searchAnalytics/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ["query", "page"],
            rowLimit: 500,
          }),
        }
      );

      const gscData = await gscRes.json();
      if (!gscData.rows?.length) return jsonResponse({ success: true, message: "No data returned from GSC", rows: 0 });

      // Transform to the format gsc-ingest uses
      const rows = gscData.rows.map((r: any) => ({
        query: r.keys[0],
        page: r.keys[1],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));

      // Aggregate and insert (same logic as gsc-ingest)
      let totalClicks = 0, totalImpressions = 0, totalPosition = 0;
      for (const row of rows) {
        totalClicks += row.clicks || 0;
        totalImpressions += row.impressions || 0;
        totalPosition += row.position || 0;
      }

      const avgPosition = rows.length > 0 ? (totalPosition / rows.length).toFixed(1) : "0";
      const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0";

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
        snapshot_date: endDate,
      }));

      await supabase.from("performance_snapshots").insert(inserts);

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
        await supabase.from("keywords").insert(keywordInserts);
      }

      return jsonResponse({ success: true, snapshots_created: inserts.length, keywords_created: keywordInserts.length });
    }

    // ── disconnect ──
    if (action === "disconnect") {
      await supabase.from("gsc_connections").delete().eq("user_id", user.id);
      return jsonResponse({ success: true });
    }

    // ── status ──
    if (action === "status") {
      const configured = !!oauthConfig;
      const { data: conn } = await supabase
        .from("gsc_connections")
        .select("site_url, connected_at")
        .eq("user_id", user.id)
        .maybeSingle();

      return jsonResponse({ configured, connected: !!conn, site_url: conn?.site_url, connected_at: conn?.connected_at });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("gsc-oauth error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
