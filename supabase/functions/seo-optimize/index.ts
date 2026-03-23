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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = data.claims.sub;

    const { contentItemId, draftContent, keyword, brandId } = await req.json();
    if (!draftContent && !contentItemId) {
      return new Response(JSON.stringify({ error: "draftContent or contentItemId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch brand settings
    let brand: any = null;
    if (brandId) {
      const { data } = await supabase.from("brands").select("*").eq("id", brandId).eq("user_id", userId).maybeSingle();
      brand = data;
    }
    if (!brand) {
      const { data } = await supabase.from("brands").select("*").eq("user_id", userId).eq("is_default", true).maybeSingle();
      brand = data;
    }

    let content = draftContent;
    if (!content && contentItemId) {
      const { data: item } = await supabase.from("content_items").select("draft_content, keyword, brand_id").eq("id", contentItemId).eq("user_id", userId).maybeSingle();
      content = item?.draft_content;
      // If content item has a brand_id and we don't have one yet, use it
      if (!brand && item?.brand_id) {
        const { data } = await supabase.from("brands").select("*").eq("id", item.brand_id).eq("user_id", userId).maybeSingle();
        brand = data;
      }
    }

    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "SEO Optimisation",
      agent_description: "Finalises meta, schema, links for max visibility",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const seoSettings = brand?.seo_settings || {};
    const metaSuffix = seoSettings.meta_title_suffix || "";
    const defaultSchemas = (seoSettings.default_schema_types || []).join(", ");
    const intentFocus = seoSettings.search_intent_focus || "";
    const brandVoice = brand?.tone_of_voice || "Professional, authoritative, results-driven";
    const targetAudience = (brand?.writing_preferences as any)?.target_audience || "Business owners, marketers, decision makers";

    const systemPrompt = `You are a world-class SEO and AEO (Answer Engine Optimisation) strategist writing for the Searchera platform.

Your role is to generate highly optimised SEO metadata for a blog article based on its content, target keyword, and brand voice.

You must produce:
1) SEO Title (max 60 characters)
2) Meta Description (max 155 characters)
3) URL Slug (short, clean, keyword focused)
4) Schema types (${defaultSchemas || "Article, FAQ, HowTo"})
5) Internal link suggestions
6) SEO improvement notes

${brand ? `\nBrand: ${brand.name}${brand.domain ? ` (${brand.domain})` : ""}
Brand Voice: ${brandVoice}
Target Audience: ${targetAudience}` : ""}

---

OBJECTIVE:
Maximise Google CTR, ranking relevance, AEO / featured snippet eligibility, and clarity of user intent match.
${intentFocus ? `Search intent focus: ${intentFocus}` : ""}

---

SEO TITLE RULES:
- Include primary keyword naturally
- Add a power word or emotional trigger
- Create curiosity or benefit-driven outcome
- Keep under 60 characters${metaSuffix ? ` — append "${metaSuffix}" if it fits within the limit` : ""}
- Avoid keyword stuffing

META DESCRIPTION RULES:
- Clear benefit-driven summary
- Include primary keyword naturally
- Add a subtle CTA (Discover, Learn, Compare, Get)
- Written for humans, not bots
- Under 155 characters

URL SLUG RULES:
- Lowercase, hyphen-separated
- No stop words (remove "and", "the", etc)
- Include primary keyword
- Max 5–6 words

---

AEO OPTIMISATION LAYER:
Ensure the title and description clearly answer the likely user query behind the keyword.
Optimise for voice search, conversational search queries, featured snippets, and AI search engines (ChatGPT, Gemini, Perplexity).

---

Also suggest internal links and provide actionable SEO improvement notes.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate optimised SEO metadata for this article.\n\nPrimary Keyword: ${keyword}\nArticle Content:\n${(content || "").substring(0, 8000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_seo",
            description: "Return SEO optimization results",
            parameters: {
              type: "object",
              properties: {
                meta_title: { type: "string" },
                meta_description: { type: "string" },
                slug: { type: "string" },
                schema_types: { type: "array", items: { type: "string" } },
                internal_links_suggested: { type: "array", items: { type: "string" } },
                seo_notes: { type: "string" },
              },
              required: ["meta_title", "meta_description", "slug", "schema_types"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_seo" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      await supabase.from("agent_runs").update({ status: "error", error_message: `AI error: ${response.status}`, completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limited" : "AI error" }), { status: response.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let seo: any = {};
    if (toolCall?.function?.arguments) {
      seo = JSON.parse(toolCall.function.arguments);
    }

    // Update content item
    if (contentItemId) {
      await supabase.from("content_items").update({
        seo_title: seo.meta_title,
        meta_description: seo.meta_description,
        slug: seo.slug,
        schema_types: seo.schema_types || [],
        status: "optimizing",
      }).eq("id", contentItemId).eq("user_id", userId);
    }

    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: 1,
      completed_at: new Date().toISOString(),
      result: seo,
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, seo }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-optimize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
