import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get content items with position data
    const { data: content } = await supabase
      .from("content_items")
      .select("keyword, url, position, title")
      .eq("user_id", userId)
      .not("url", "is", null);

    if (!content || content.length === 0) {
      return new Response(JSON.stringify({ updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Use AI to estimate AI citation status
    const prompt = `Given these web pages, estimate which ones are likely cited by AI answer engines (Google AI Overviews, ChatGPT, Perplexity). Consider: high authority content, direct answer style, FAQ sections, and top-ranking positions.

Pages:
${content.map((c: any) => `- "${c.title}" at ${c.url} (position: ${c.position || "unknown"})`).join("\n")}

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

    let citationMap = new Map<string, { ai_cited: boolean; ai_engine: string }>();
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        (parsed.citations || []).forEach((c: any) => {
          citationMap.set(c.url, { ai_cited: c.ai_cited || false, ai_engine: c.ai_engine || "none" });
        });
      }
    } catch {
      console.error("Failed to parse AI response");
    }

    // Insert new ranking snapshots
    const today = new Date().toISOString().split("T")[0];
    const rows = content.map((c: any) => {
      const key = `${c.keyword}||${c.url}`;
      const cite = citationMap.get(c.url);
      return {
        user_id: userId,
        keyword: c.keyword,
        url: c.url,
        position: c.position || null,
        previous_position: prevMap.get(key) || null,
        ai_cited: cite?.ai_cited || false,
        ai_engine: cite?.ai_engine === "none" ? null : cite?.ai_engine || null,
        snapshot_date: today,
      };
    });

    const { error } = await supabase.from("rankings").insert(rows);
    if (error) throw error;

    // Also insert AI citations
    const citationRows = content
      .filter((c: any) => citationMap.has(c.url) && citationMap.get(c.url)!.ai_cited)
      .map((c: any) => ({
        user_id: userId,
        url: c.url,
        engine: citationMap.get(c.url)!.ai_engine,
        cited: true,
        snippet: null,
      }));

    if (citationRows.length > 0) {
      await supabase.from("ai_citations").insert(citationRows);
    }

    return new Response(JSON.stringify({ updated: rows.length }), {
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
