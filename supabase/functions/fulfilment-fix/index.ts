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

    const { contentItemId, criterionId, criterion } = await req.json();
    if (!contentItemId || !criterionId || !criterion) throw new Error("contentItemId, criterionId, and criterion required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get content item
    const { data: content, error: cErr } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentItemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (cErr || !content) throw new Error("Content item not found");

    // Get brand for internal linking context
    let brandDomain = "";
    let sitemapUrls: string[] = [];
    if (content.brand_id) {
      const { data: brand } = await supabase.from("brands").select("domain").eq("id", content.brand_id).maybeSingle();
      brandDomain = brand?.domain || "";

      const { data: pages } = await supabase
        .from("sitemap_pages")
        .select("url, title")
        .eq("brand_id", content.brand_id)
        .eq("user_id", userId)
        .limit(50);
      sitemapUrls = (pages || []).map((p: any) => `${p.url} (${p.title || ""})`);
    }

    // Get other published content for internal linking
    const { data: otherContent } = await supabase
      .from("content_items")
      .select("title, slug, url")
      .eq("user_id", userId)
      .in("status", ["published", "monitoring"])
      .neq("id", contentItemId)
      .limit(30);

    const existingDraft = content.draft_content || "";

    let prompt = "";

    if (criterion.includes("Internal links")) {
      const availableLinks = [
        ...(otherContent || []).map((c: any) => `- "${c.title}" → ${c.url || c.slug || ""}`),
        ...sitemapUrls.map((u) => `- ${u}`),
      ].join("\n");

      prompt = `You are an SEO expert. The following article is missing internal links (needs at least 3).

Article title: ${content.title}
Brand domain: ${brandDomain || "unknown"}
Current draft (markdown):
${existingDraft.substring(0, 4000)}

Available pages to link to:
${availableLinks.substring(0, 2000)}

Add at least 3 contextually relevant internal links naturally within the existing content. Use markdown link format [anchor text](url). Return the FULL updated draft content with links integrated naturally. Only return the markdown content, no explanations.`;

    } else if (criterion.includes("Image alt")) {
      prompt = `You are an SEO expert. The following article has images without alt attributes.

Article title: ${content.title}
Keyword: ${content.keyword}
Current draft (markdown):
${existingDraft.substring(0, 4000)}

Find all markdown images (![...](...)) that are missing descriptive alt text and add SEO-optimized alt attributes. If images already have alt text, improve them to be more descriptive and keyword-relevant. Return the FULL updated draft content. Only return the markdown content, no explanations.`;

    } else if (criterion.includes("Cited sources")) {
      prompt = `You are an SEO and GEO expert. The following article needs cited sources for better AI engine optimization.

Article title: ${content.title}
Keyword: ${content.keyword}
Current draft (markdown):
${existingDraft.substring(0, 4000)}

Add 3-5 credible source citations naturally within the content. Use formats like "According to [Source Name](url)..." or "Research from [Organization](url) shows...". Use plausible, authoritative sources relevant to the topic. Also add a "Sources" or "References" section at the end. Return the FULL updated draft content. Only return the markdown content, no explanations.`;

    } else if (criterion.includes("FAQ")) {
      prompt = `You are a GEO expert. The article needs an FAQ section for better AI engine visibility.

Article title: ${content.title}
Keyword: ${content.keyword}
Current draft (markdown):
${existingDraft.substring(0, 4000)}

Add a comprehensive FAQ section with 5 relevant questions and answers at the end of the article before any existing references/sources section. Use ## FAQ as the heading and format each Q&A clearly. Return the FULL updated draft content. Only return the markdown content, no explanations.`;

    } else if (criterion.includes("Direct answer")) {
      prompt = `You are a GEO expert. The article needs a direct answer paragraph for AI engine optimization.

Article title: ${content.title}
Keyword: ${content.keyword}
Current draft (markdown):
${existingDraft.substring(0, 4000)}

Add or improve the opening paragraph to directly answer the main question "${content.keyword}" in 2-3 concise sentences. This should be a clear, factual summary that AI engines can extract as a featured snippet. Return the FULL updated draft content. Only return the markdown content, no explanations.`;

    } else if (criterion.includes("Meta title") || criterion.includes("Meta description")) {
      // These are metadata fixes, not content fixes
      prompt = `You are an SEO expert. Generate optimal metadata for this article.

Article title: ${content.title}
Keyword: ${content.keyword}
Current SEO Title: ${content.seo_title || "not set"}
Current Meta Description: ${content.meta_description || "not set"}
Draft excerpt: ${existingDraft.substring(0, 1000)}

Return JSON only: { "seo_title": "optimized title under 60 chars", "meta_description": "compelling description under 160 chars" }`;
    } else if (criterion.includes("H1")) {
      prompt = `You are an SEO expert. The article needs a proper H1 tag.

Article title: ${content.title}
Keyword: ${content.keyword}
Current draft (markdown):
${existingDraft.substring(0, 4000)}

Ensure the article starts with a single # H1 heading that includes the primary keyword naturally. Return the FULL updated draft content. Only return the markdown content, no explanations.`;

    } else if (criterion.includes("Word count")) {
      prompt = `You are an SEO content expert. The article needs more content (minimum 800 words).

Article title: ${content.title}
Keyword: ${content.keyword}
Current draft (markdown):
${existingDraft.substring(0, 4000)}

Expand the article to at least 800 words by adding more depth, examples, and actionable advice. Maintain the existing structure and tone. Return the FULL updated draft content. Only return the markdown content, no explanations.`;

    } else if (criterion.includes("Schema")) {
      // Schema fix - update schema_types
      const schemaTypes = [...new Set([...(content.schema_types || []), "Article", "FAQPage"])];
      await supabase.from("content_items").update({ schema_types: schemaTypes }).eq("id", contentItemId);
      await supabase.from("seo_fulfilment").update({ passed: true, details: "Schema types updated to include Article and FAQPage", checked_at: new Date().toISOString() }).eq("id", criterionId);
      return new Response(JSON.stringify({ fixed: true, type: "schema" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error(`No fix available for criterion: ${criterion}`);
    }

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

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const aiData = await aiRes.json();
    const text = aiData?.choices?.[0]?.message?.content || "";

    if (!text) throw new Error("Empty AI response");

    // Handle metadata fix
    if (criterion.includes("Meta title") || criterion.includes("Meta description")) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const meta = JSON.parse(jsonMatch[0]);
          const updates: any = {};
          if (meta.seo_title) updates.seo_title = meta.seo_title;
          if (meta.meta_description) updates.meta_description = meta.meta_description;
          await supabase.from("content_items").update(updates).eq("id", contentItemId);
          await supabase.from("seo_fulfilment").update({ passed: true, details: "Metadata updated by AI fix", checked_at: new Date().toISOString() }).eq("id", criterionId);
          return new Response(JSON.stringify({ fixed: true, type: "metadata", updates }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch { /* fall through */ }
    }

    // Content fix - update draft
    const cleanedContent = text.replace(/^```(?:markdown)?\n?/, "").replace(/\n?```$/, "").trim();
    await supabase.from("content_items").update({ draft_content: cleanedContent, updated_at: new Date().toISOString() }).eq("id", contentItemId);
    await supabase.from("seo_fulfilment").update({ passed: true, details: `Fixed by AI: ${criterion}`, checked_at: new Date().toISOString() }).eq("id", criterionId);

    return new Response(JSON.stringify({ fixed: true, type: "content" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fulfilment-fix error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
