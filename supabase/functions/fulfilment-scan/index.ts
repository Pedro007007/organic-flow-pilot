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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { contentItemId } = await req.json();
    if (!contentItemId) throw new Error("contentItemId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the content item - verify it belongs to the authenticated user
    const { data: content, error: cErr } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentItemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (cErr || !content) throw new Error("Content item not found");

    // Get fulfilment criteria for this content
    const { data: criteria } = await supabase
      .from("seo_fulfilment")
      .select("*")
      .eq("content_item_id", contentItemId)
      .eq("user_id", userId);

    if (!criteria || criteria.length === 0) {
      return new Response(JSON.stringify({ passed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to check each criterion
    const prompt = `Analyze this content item and determine which SEO/GEO criteria are met.

Content:
- Title: ${content.title}
- SEO Title: ${content.seo_title || "not set"}
- Meta Description: ${content.meta_description || "not set"}
- Slug: ${content.slug || "not set"}
- Schema Types: ${(content.schema_types || []).join(", ") || "none"}
- Draft (first 1000 chars): ${(content.draft_content || "").substring(0, 1000)}
- Word count: ~${(content.draft_content || "").split(/\s+/).length}

Criteria to check:
${criteria.map((c: any) => `- ID: ${c.id} | "${c.criterion}" (${c.category})`).join("\n")}

Return JSON: { "results": [{ "id": "...", "passed": true/false, "details": "brief reason" }] }`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    console.log("AI response status:", aiRes.status, "body keys:", Object.keys(aiData));
    const text = aiData?.choices?.[0]?.message?.content || "";
    if (!text) console.error("Empty AI response:", JSON.stringify(aiData).substring(0, 500));

    let results: any[] = [];
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        results = parsed.results || [];
      }
    } catch {
      console.error("Failed to parse AI response:", text);
    }

    // Update each criterion
    let passedCount = 0;
    for (const r of results) {
      if (r.id && typeof r.passed === "boolean") {
        await supabase
          .from("seo_fulfilment")
          .update({ passed: r.passed, details: r.details || null, checked_at: new Date().toISOString() })
          .eq("id", r.id);
        if (r.passed) passedCount++;
      }
    }

    return new Response(JSON.stringify({ passed: passedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fulfilment-scan error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
