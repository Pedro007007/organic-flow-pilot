import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const IMAGE_MODELS = [
  "google/gemini-3.1-flash-image-preview",
  "google/gemini-3-pro-image-preview",
  "google/gemini-2.5-flash-image",
];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateBodyImage(apiKey: string, keyword: string, title: string, index: number, brand: any): Promise<string | null> {
  const imgStyle = brand?.image_defaults?.style || "modern editorial";
  const palette = brand?.image_defaults?.color_palette || "dark blue, electric purple, white";
  const prompt = "Generate a high-quality, professional 16:9 editorial illustration for a blog article.\n" +
    "Topic: " + (title || keyword) + "\n" +
    "This is body image #" + (index + 1) + " placed within the article to visually support the content.\n\n" +
    "STYLE: " + imgStyle + "\n" +
    "COLOUR PALETTE: " + palette + "\n" +
    "COMPOSITION: Clean, no text or words, visually relevant to the topic, 1920x1080 pixels landscape.\n" +
    "The image should look like premium editorial photography or illustration, NOT a stock photo.";

  for (const model of IMAGE_MODELS) {
    try {
      const res = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], modalities: ["image", "text"] }),
      });
      if (!res.ok) {
        console.warn("Body image " + (index + 1) + " model " + model + " failed: " + res.status);
        if (res.status === 429) { await sleep(3000); continue; }
        continue;
      }
      const data = await res.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageData) return imageData;
    } catch (e) {
      console.warn("Body image " + (index + 1) + " model " + model + " error:", e);
    }
  }
  return null;
}

async function uploadBase64Image(supabaseAdmin: any, base64Url: string, userId: string, contentItemId: string, suffix: string): Promise<string | null> {
  const match = base64Url.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;
  const format = match[1];
  const binary = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  const fileName = userId + "/" + contentItemId + "-body-" + suffix + "-" + Date.now() + "." + format;
  const { error } = await supabaseAdmin.storage.from("content-images").upload(fileName, binary, { contentType: "image/" + format, upsert: true });
  if (error) { console.error("Body image upload error:", error); return null; }
  const { data } = supabaseAdmin.storage.from("content-images").getPublicUrl(fileName);
  return data.publicUrl;
}
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_APP_ORIGIN = "https://organic-flow-pilot.lovable.app";

const normalizeDomain = (domain?: string | null) =>
  domain ? domain.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

const sanitizeMarkdownUrlValue = (value: string) => value.trim().replace(/\s+/g, "");

const resolveAbsoluteUrl = (value: string | null | undefined, preferredDomain?: string | null) => {
  if (!value) return null;
  const sanitizedValue = sanitizeMarkdownUrlValue(value);
  const domain = normalizeDomain(preferredDomain);
  const preferredOrigin = domain ? `https://${domain}` : DEFAULT_APP_ORIGIN;

  if (sanitizedValue.startsWith("/")) {
    return `${preferredOrigin}${sanitizedValue}`;
  }
  try {
    const parsed = new URL(sanitizedValue);
    const isLovableHost = parsed.hostname.endsWith(".lovable.app");
    const isStorageHost = parsed.hostname.includes(".supabase.co");
    if (isStorageHost) return sanitizedValue;
    if (isLovableHost) {
      return `${preferredOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return sanitizedValue;
  } catch {
    return sanitizedValue;
  }
};

const normalizeMarkdownLinks = (content: string, preferredDomain?: string | null) =>
  content.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (_match, prefix, url, suffix) => {
    const normalizedUrl = resolveAbsoluteUrl(url, preferredDomain);
    return `${prefix}${normalizedUrl || sanitizeMarkdownUrlValue(url)}${suffix}`;
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = data.claims.sub;

    const body = await req.json();
    let { contentItemId, outline, keyword, title, serpResearch, strategy, brandId, context, referenceLinks, extraKeywords } = body;
    if (!outline && !keyword) {
      return new Response(JSON.stringify({ error: "outline or keyword required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If contentItemId provided, load the item to get its brand_id and saved context
    if (contentItemId) {
      const { data: savedItem } = await supabase.from("content_items").select("brand_id, context, reference_links, extra_keywords, keyword, title, serp_research").eq("id", contentItemId).maybeSingle();
      if (savedItem) {
        if (!brandId && savedItem.brand_id) brandId = savedItem.brand_id;
        if (!context && savedItem.context) context = savedItem.context;
        if ((!referenceLinks || referenceLinks.length === 0) && savedItem.reference_links) referenceLinks = savedItem.reference_links;
        if ((!extraKeywords || extraKeywords.length === 0) && savedItem.extra_keywords) extraKeywords = savedItem.extra_keywords;
        if (!keyword && savedItem.keyword) keyword = savedItem.keyword;
        if (!title && savedItem.title) title = savedItem.title;
        if (!serpResearch && savedItem.serp_research) serpResearch = savedItem.serp_research;
      }
    }

    // Fetch brand settings if brandId provided
    let brand: any = null;
    if (brandId) {
      const { data } = await supabase.from("brands").select("*").eq("id", brandId).eq("user_id", userId).maybeSingle();
      brand = data;
    }
    if (!brand) {
      // Fallback to default brand
      const { data } = await supabase.from("brands").select("*").eq("user_id", userId).eq("is_default", true).maybeSingle();
      brand = data;
    }

    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Content Generation",
      agent_description: "Writes human-quality, intent-based SEO content with internal links",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch existing published content for internal linking
    const { data: existingContent } = await supabase
      .from("content_items")
      .select("title, keyword, slug, url")
      .eq("user_id", userId)
      .in("status", ["published", "monitoring"])
      .neq("id", contentItemId || "")
      .or("url.not.is.null,slug.not.is.null")
      .limit(20);

    // Fetch sitemap pages for richer internal link candidates
    const resolvedBrandId = brandId || brand?.id;
    const preferredDomain = brand?.domain || null;
    let sitemapQuery = supabase
      .from("sitemap_pages")
      .select("url, title")
      .eq("user_id", userId)
      .limit(50);
    if (resolvedBrandId) {
      sitemapQuery = sitemapQuery.eq("brand_id", resolvedBrandId);
    }
    let { data: sitemapPages } = await sitemapQuery;

    // Fallback: if brand-specific query returned nothing, try all user sitemap pages
    if ((!sitemapPages || sitemapPages.length === 0) && resolvedBrandId) {
      const { data: fallbackPages } = await supabase
        .from("sitemap_pages")
        .select("url, title")
        .eq("user_id", userId)
        .limit(50);
      sitemapPages = fallbackPages;
    }

    // Merge: sitemap pages first (real live URLs), then content items, deduplicated
    // Resolve all URLs to absolute using the brand's domain
    const seen = new Set<string>();
    const linkCandidates: { title: string; url: string; keyword?: string }[] = [];

    for (const sp of sitemapPages || []) {
      const resolvedUrl = resolveAbsoluteUrl(sp.url, preferredDomain);
      if (resolvedUrl && !seen.has(resolvedUrl)) {
        seen.add(resolvedUrl);
        linkCandidates.push({ title: sp.title || resolvedUrl, url: resolvedUrl });
      }
    }
    for (const c of (existingContent || []) as any[]) {
      const raw = c.url || (c.slug ? `/blog/${c.slug}` : null);
      const u = resolveAbsoluteUrl(raw, preferredDomain);
      if (u && !seen.has(u)) {
        seen.add(u);
        linkCandidates.push({ title: c.title, url: u, keyword: c.keyword });
      }
    }

    // Build brand-aware system prompt
    const wp = brand?.writing_preferences || {};
    const linkConfig = brand?.internal_linking_config || {};
    const maxLinks = linkConfig.max_links || linkConfig.max_links_per_article || 8;
    const anchorStyle = linkConfig.anchor_style || linkConfig.anchor_text_style || "natural";
    const linkingEnabled = linkConfig.enabled !== false;

    // Cap candidates at maxLinks * 3 to give AI options
    const cappedCandidates = linkCandidates.slice(0, maxLinks * 3);
    const internalLinks = cappedCandidates
      .map((l) => `- [${l.title}](${l.url})${l.keyword ? ` — about "${l.keyword}"` : ""}`)
      .join("\n");

    const toneInstruction = brand?.tone_of_voice ? `- Tone of voice: ${brand.tone_of_voice}` : "";
    const styleInstruction = brand?.writing_style ? `- Writing style: ${brand.writing_style}` : "";
    const wordCountInstruction = wp.min_word_count || wp.max_word_count
      ? `- Target word count: ${wp.min_word_count || 2500}–${wp.max_word_count || 4000} words (MINIMUM ${wp.min_word_count || 2500} words). Each H2 section must be 200-300+ words.`
      : "- Target word count: 2500–4000 words (MINIMUM 2500 words, approximately 15,000+ characters). Each H2 section must be 200-300+ words with examples and actionable detail.";
    const clicheInstruction = (wp.avoid_cliches || []).length > 0
      ? `- NEVER use these phrases: ${wp.avoid_cliches.join(", ")}`
      : '- No AI clichés ("In today\'s digital landscape", "Let\'s dive in", etc.)';

    const systemPrompt = `You are a Human-level SEO Copywriter with deep subject understanding.
${brand ? `\nBrand: ${brand.name}${brand.domain ? ` (${brand.domain})` : ""}` : ""}

Style Rules:
- Confident, clear, practical
${toneInstruction}
${styleInstruction}
${clicheInstruction}
- No fluff or filler intros
- Write like a real expert with first-hand experience
${wordCountInstruction}

Must Include:
- Clear answers to user intent
- Semantic keyword usage (natural, not stuffed)
- Scannable formatting with proper headings
- FAQ section with direct answers
- Strong call to action (do NOT write a closing CTA mentioning any company name or contact details — one will be appended automatically)
- TWO image placeholders: place exactly {{IMAGE_1}} and {{IMAGE_2}} on their own lines at natural break points within the article (NOT at the very beginning or end). Place them between sections where a visual would enhance understanding.
${linkingEnabled && internalLinks ? `- MANDATORY Internal Links: You MUST include at least ${Math.min(maxLinks, Math.max(2, cappedCandidates.length))} of the following internal links in the article body (use ${anchorStyle} anchor text). Spread them across different sections — NOT all in one paragraph. Each link should be contextually relevant to the surrounding text:\n${internalLinks}\n- CRITICAL: Do NOT return an article with zero internal links when candidates are provided above.` : !linkingEnabled ? "- Do not include internal links." : "- Internal link placeholders: use [Related: Topic Name](/blog/topic-slug) format for suggested internal links"}

Must Avoid:
- Keyword stuffing
- Over-optimisation
- Generic phrasing
- Repetitive sentence patterns
- Placing images at the start or end of the article

Output format: Markdown with proper H1, H2, H3 headings.`;

    // Build user prompt from available data
    const serpBlock = serpResearch
      ? `\n\nSERP Research:\n- Avg competitor word count: ${serpResearch.avg_word_count || "N/A"}\n- Common headings: ${(serpResearch.common_headings || []).join(", ")}\n- Content gaps to fill: ${(serpResearch.content_gaps || []).join("; ")}\n- FAQ questions to answer: ${(serpResearch.faq_questions || []).join("; ")}\n- Unique angles: ${(serpResearch.unique_angles || []).join("; ")}`
      : "";
    const contextBlock = context ? `\n\nAdditional context: ${context}` : "";
    const extraKwBlock = extraKeywords?.length ? `\nSecondary keywords to weave in: ${extraKeywords.join(", ")}` : "";
    const refBlock = referenceLinks?.length ? `\nReference links for inspiration: ${referenceLinks.join(", ")}` : "";
    const outlineBlock = outline ? `\n\nOutline to follow:\n${outline}` : "";

    const userPrompt = `Write a comprehensive, expert-level SEO article.
Topic/Keyword: ${keyword}
Title: ${title || keyword}${serpBlock}${contextBlock}${extraKwBlock}${refBlock}${outlineBlock}`;

    const MIN_CONTENT_LENGTH = 6000;
    const MAX_ATTEMPTS = 3;
    const MODELS = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview", "google/gemini-2.5-pro"];
    let content = "";

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const model = attempt === 0 ? MODELS[0] : MODELS[Math.min(attempt, MODELS.length - 1)];
      console.log(`Attempt ${attempt + 1}/${MAX_ATTEMPTS} using model: ${model}`);

      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }

      const messages = attempt === 0 || !content
        ? [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ]
        : [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
            { role: "assistant", content: content },
            { role: "user", content: `The article above is only ${content.length} characters, which is far too short. The MINIMUM is ${MIN_CONTENT_LENGTH} characters. Please rewrite the ENTIRE article from scratch, making it at least 2500 words. Expand every section with more examples, deeper analysis, practical tips, and detailed explanations. Do NOT summarise — write the full article again in Markdown.` },
          ];

      let response: Response;
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            max_tokens: 16384,
            messages,
          }),
        });
      } catch (fetchErr) {
        console.error(`Attempt ${attempt + 1}: fetch error:`, fetchErr);
        if (attempt < MAX_ATTEMPTS - 1) continue;
        await supabase.from("agent_runs").update({ status: "error", error_message: "Network error contacting AI", completed_at: new Date().toISOString() }).eq("id", run?.id);
        return new Response(JSON.stringify({ error: "Failed to reach AI service. Please try again." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Attempt ${attempt + 1}: AI gateway error ${response.status}:`, errText);
        if (response.status === 429) {
          if (attempt < MAX_ATTEMPTS - 1) { await new Promise(r => setTimeout(r, 5000)); continue; }
          await supabase.from("agent_runs").update({ status: "error", error_message: "Rate limited", completed_at: new Date().toISOString() }).eq("id", run?.id);
          return new Response(JSON.stringify({ error: "Rate limited — please try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (attempt < MAX_ATTEMPTS - 1) continue;
        await supabase.from("agent_runs").update({ status: "error", error_message: `AI error: ${response.status}`, completed_at: new Date().toISOString() }).eq("id", run?.id);
        return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const rawText = await response.text();
      const trimmed = rawText.trim();
      
      if (!trimmed || trimmed.length < 50) {
        console.error(`Attempt ${attempt + 1}: AI returned empty/whitespace response (${rawText.length} raw chars)`);
        if (attempt < MAX_ATTEMPTS - 1) continue;
        await supabase.from("agent_runs").update({ status: "error", error_message: "AI returned empty response", completed_at: new Date().toISOString() }).eq("id", run?.id);
        return new Response(JSON.stringify({ error: "AI returned an empty response. Please try again." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let aiResult: any;
      try {
        aiResult = JSON.parse(trimmed);
      } catch (parseErr) {
        console.error(`Attempt ${attempt + 1}: Failed to parse AI response (${trimmed.length} chars). First 200: ${trimmed.slice(0, 200)}`);
        if (attempt < MAX_ATTEMPTS - 1) continue;
        await supabase.from("agent_runs").update({ status: "error", error_message: "AI returned truncated response", completed_at: new Date().toISOString() }).eq("id", run?.id);
        return new Response(JSON.stringify({ error: "AI returned an incomplete response. Please try again." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const finishReason = aiResult.choices?.[0]?.finish_reason;
      if (finishReason === "length" || finishReason === "max_tokens") {
        console.warn(`Attempt ${attempt + 1}: Response truncated by model (finish_reason: ${finishReason})`);
      }

      content = aiResult.choices?.[0]?.message?.content || "";
      console.log(`Attempt ${attempt + 1}: content length = ${content.length} characters`);

      if (content.length >= MIN_CONTENT_LENGTH) break;
    }

    console.log(`Final content length: ${content.length} characters`);

    // Detect placeholders — body images will be generated in the background after responding
    const hasPlaceholder1 = content.includes("{{IMAGE_1}}");
    const hasPlaceholder2 = content.includes("{{IMAGE_2}}");

    // Build brand-aware CTA paragraph
    const brandName = brand?.name || "us";
    const brandDomain = brand?.domain ? (brand.domain.startsWith("http") ? brand.domain : `https://${brand.domain}`) : null;
    const defaultCta = brandDomain
      ? `---\n\n*Ready to grow your online presence? Contact [${brandName}](${brandDomain}) today to discover how our expert SEO and content strategies can help your business reach more customers.*`
      : `---\n\n*Ready to grow your online presence? Contact ${brandName} today to discover how our expert SEO and content strategies can help your business reach more customers.*`;
    const ctaParagraph = brand?.cta_text || defaultCta;

    // Strip any trailing CTA paragraphs (old hardcoded or AI-generated), then append brand CTA
    content = content.replace(/\n---\n[\s\S]*(?:contact|reach out|get in touch)[\s\S]*$/i, "").trimEnd();
    content = content.replace(/\n\n\*[^*]*(?:contact|reach out|get in touch)[^*]*\*\s*$/i, "").trimEnd();
    content = content.trimEnd() + "\n\n" + ctaParagraph;

    // Normalize all markdown links to use the brand's domain (fixes relative paths and cross-brand URLs)
    content = normalizeMarkdownLinks(content, preferredDomain);

    // Generate Technical SEO metadata via tool calling
    let seoMetadata: { seo_title: string; meta_description: string; slug: string; schema_types: string[] } = {
      seo_title: "",
      meta_description: "",
      slug: "",
      schema_types: ["Article"],
    };

    try {
      const metaRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You are an elite SEO metadata specialist. Generate optimised metadata for the given article." },
            { role: "user", content: `Generate SEO metadata for this article.\n\nTitle: ${title || keyword}\nKeyword: ${keyword}\n\nFirst 500 chars of content:\n${content.slice(0, 500)}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "set_seo_metadata",
                description: "Set the SEO metadata for the article",
                parameters: {
                  type: "object",
                  properties: {
                    seo_title: { type: "string", description: "SEO title, 50-60 chars, keyword first, compelling" },
                    meta_description: { type: "string", description: "Meta description, 150-160 chars, includes keyword and CTA" },
                    slug: { type: "string", description: "URL-safe slug, lowercase, hyphens, max 60 chars, keyword-rich, no stop words" },
                    schema_types: { type: "array", items: { type: "string" }, description: "Schema.org types e.g. Article, FAQPage, HowTo" },
                  },
                  required: ["seo_title", "meta_description", "slug", "schema_types"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "set_seo_metadata" } },
        }),
      });

      if (metaRes.ok) {
        const metaResult = await metaRes.json();
        const toolCall = metaResult.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          seoMetadata = {
            seo_title: (parsed.seo_title || "").slice(0, 70),
            meta_description: (parsed.meta_description || "").slice(0, 170),
            slug: (parsed.slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60),
            schema_types: Array.isArray(parsed.schema_types) ? parsed.schema_types : ["Article"],
          };
        }
      } else {
        console.warn("SEO metadata generation failed:", metaRes.status);
      }
    } catch (metaErr) {
      console.warn("SEO metadata error:", metaErr);
    }

    // Update content item if provided
    if (contentItemId) {
      await supabase.from("content_items").update({
        draft_content: content,
        status: "writing",
        seo_title: seoMetadata.seo_title || null,
        meta_description: seoMetadata.meta_description || null,
        slug: seoMetadata.slug || null,
        schema_types: seoMetadata.schema_types,
      }).eq("id", contentItemId).eq("user_id", userId);
    }

    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: 1,
      completed_at: new Date().toISOString(),
      result: { content_length: content.length, content_item_id: contentItemId, body_images: bodyImagesGenerated, brand: brand?.name || null },
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
