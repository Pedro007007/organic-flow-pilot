import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get content items with URLs to track
    const { data: content } = await supabase
      .from("content_items")
      .select("keyword, url, title")
      .eq("user_id", userId)
      .not("url", "is", null);

    if (!content || content.length === 0) {
      return new Response(JSON.stringify({ updated: 0, message: "No content with URLs to track" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get GSC connection for real position data
    const { data: gscConn } = await supabase
      .from("gsc_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let gscPositionMap = new Map<string, { position: number; clicks: number; impressions: number }>();

    if (gscConn?.refresh_token) {
      const clientId = Deno.env.get("GSC_CLIENT_ID");
      const clientSecret = Deno.env.get("GSC_CLIENT_SECRET");

      if (clientId && clientSecret && gscConn.site_url) {
        try {
          // Refresh access token
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: gscConn.refresh_token,
              grant_type: "refresh_token",
            }),
          });

          const tokenData = await tokenRes.json();
          console.log("GSC token refresh status:", tokenRes.status, tokenData.error || "ok");

          if (tokenData.access_token) {
            // Update stored token
            const expiresAt = tokenData.expires_in
              ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
              : null;
            await supabase
              .from("gsc_connections")
              .update({ access_token: tokenData.access_token, token_expires_at: expiresAt })
              .eq("user_id", userId);

            // Query GSC for positions of tracked keywords
            const endDate = new Date().toISOString().split("T")[0];
            const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

            const gscRes = await fetch(
              `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscConn.site_url)}/searchAnalytics/query`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  startDate,
                  endDate,
                  dimensions: ["query", "page"],
                  rowLimit: 1000,
                }),
              }
            );

            const gscData = await gscRes.json();
            console.log(`GSC returned ${gscData.rows?.length || 0} rows`);

            if (gscData.rows?.length) {
              for (const row of gscData.rows) {
                const query = row.keys[0]?.toLowerCase();
                const page = row.keys[1];
                // Map by keyword||page for matching
                const key = `${query}||${page}`;
                gscPositionMap.set(key, {
                  position: Math.round(row.position * 10) / 10,
                  clicks: row.clicks || 0,
                  impressions: row.impressions || 0,
                });
                // Also map by keyword only (fallback)
                if (!gscPositionMap.has(query)) {
                  gscPositionMap.set(query, {
                    position: Math.round(row.position * 10) / 10,
                    clicks: row.clicks || 0,
                    impressions: row.impressions || 0,
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error("GSC fetch error:", e);
        }
      }
    }

    // Get existing rankings for previous_position
    const { data: existing } = await supabase
      .from("rankings")
      .select("keyword, url, position")
      .eq("user_id", userId)
      .order("snapshot_date", { ascending: false })
      .limit(500);

    const prevMap = new Map<string, number>();
    (existing || []).forEach((r: any) => {
      const key = `${r.keyword}||${r.url}`;
      if (!prevMap.has(key)) prevMap.set(key, Number(r.position));
    });

    // Match content items to GSC data
    const siteUrl = gscConn?.site_url?.replace(/\/$/, "") || "";
    const today = new Date().toISOString().split("T")[0];
    const rows = content.map((c: any) => {
      const kwLower = c.keyword?.toLowerCase() || "";
      const contentUrl = c.url || "";
      // Build full URL for matching (content stores relative paths like /blog/...)
      const fullUrl = contentUrl.startsWith("http") ? contentUrl : `${siteUrl}${contentUrl.startsWith("/") ? "" : "/"}${contentUrl}`;

      // Try exact keyword+fullUrl match
      let gscMatch = gscPositionMap.get(`${kwLower}||${fullUrl}`);
      if (!gscMatch) {
        // Try matching by URL path suffix in GSC data
        for (const [key, val] of gscPositionMap.entries()) {
          if (key.includes("||")) {
            const gscUrl = key.split("||")[1];
            if (gscUrl === fullUrl || gscUrl.endsWith(contentUrl) || contentUrl.endsWith(new URL(gscUrl).pathname)) {
              gscMatch = val;
              break;
            }
          }
        }
      }
      if (!gscMatch) {
        // Try keyword-only match (best position for this keyword across all pages)
        for (const [key, val] of gscPositionMap.entries()) {
          if (!key.includes("||") && (key === kwLower || kwLower.includes(key) || key.includes(kwLower))) {
            gscMatch = val;
            break;
          }
        }
      }
      console.log(`Matching "${c.keyword}" (${contentUrl} → ${fullUrl}): ${gscMatch ? `pos ${gscMatch.position}` : "no match"}`);

      const position = gscMatch?.position || null;
      const prevKey = `${c.keyword}||${c.url}`;

      return {
        user_id: userId,
        keyword: c.keyword,
        url: c.url,
        position,
        previous_position: prevMap.get(prevKey) || null,
        ai_cited: false,
        ai_engine: null,
        snapshot_date: today,
      };
    });

    // Also update content_items with latest position data
    for (const r of rows) {
      if (r.position !== null) {
        const matchingGsc = gscPositionMap.get(`${r.keyword.toLowerCase()}||${r.url}`) ||
          gscPositionMap.get(r.keyword.toLowerCase());
        await supabase
          .from("content_items")
          .update({
            position: r.position,
            clicks: matchingGsc?.clicks || 0,
            impressions: matchingGsc?.impressions || 0,
          })
          .eq("user_id", userId)
          .eq("url", r.url);
      }
    }

    const { error } = await supabase.from("rankings").insert(rows);
    if (error) throw error;

    // AI citation check using Lovable AI
    try {
      const pagesWithPosition = rows.filter((r) => r.position !== null);
      if (pagesWithPosition.length > 0) {
        const prompt = `Given these web pages, estimate which ones are likely cited by AI answer engines (Google AI Overviews, ChatGPT, Perplexity). Consider: high authority content, direct answer style, FAQ sections, and top-ranking positions.

Pages:
${pagesWithPosition.map((r) => `- "${content.find((c: any) => c.url === r.url)?.title || r.url}" at ${r.url} (position: ${r.position})`).join("\n")}

Return JSON: { "citations": [{ "url": "...", "ai_cited": true/false, "ai_engine": "google_ai|chatgpt|perplexity|none" }] }`;

        const aiRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-gateway`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const aiData = await aiRes.json();
        const aiText = aiData?.choices?.[0]?.message?.content || "";

        try {
          const jsonMatch = aiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const citationRows = (parsed.citations || [])
              .filter((c: any) => c.ai_cited)
              .map((c: any) => ({
                user_id: userId,
                url: c.url,
                engine: c.ai_engine || "none",
                cited: true,
                snippet: null,
              }));

            if (citationRows.length > 0) {
              await supabase.from("ai_citations").insert(citationRows);
              // Update rankings with AI citation data
              for (const cite of citationRows) {
                await supabase
                  .from("rankings")
                  .update({ ai_cited: true, ai_engine: cite.engine === "none" ? null : cite.engine })
                  .eq("user_id", userId)
                  .eq("url", cite.url)
                  .eq("snapshot_date", today);
              }
            }
          }
        } catch {
          console.error("Failed to parse AI citation response");
        }
      }
    } catch (e) {
      console.error("AI citation check error (non-fatal):", e);
    }

    const withPosition = rows.filter((r) => r.position !== null).length;
    console.log(`Rankings check: ${rows.length} tracked, ${withPosition} with GSC position data`);

    return new Response(JSON.stringify({ updated: rows.length, with_position: withPosition }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("rankings-check error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
