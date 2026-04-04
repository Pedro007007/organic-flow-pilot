import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      agent_description: "Writes human-quality, intent-based SEO content with internal links and images",
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
      ? `- Target word count: ${wp.min_word_count || 1500}–${wp.max_word_count || 3500} words`
      : "";
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
          { role: "user", content: `Write a complete SEO article.\n\nTitle: ${title || keyword}\nKeyword: ${keyword}\nOutline: ${JSON.stringify(outline || "Create your own outline based on the keyword")}${context ? `\n\nCONTEXT & INSTRUCTIONS:\n${context}` : ""}${referenceLinks && referenceLinks.length > 0 ? `\n\nREFERENCE SOURCES (use these as inspiration and factual reference):\n${referenceLinks.map((l: string) => `- ${l}`).join("\n")}` : ""}${extraKeywords && extraKeywords.length > 0 ? `\n\nSECONDARY KEYWORDS (weave these naturally throughout the article):\n${extraKeywords.join(", ")}` : ""}${serpResearch ? `\n\nCOMPETITOR INTELLIGENCE:\n- Content gaps to exploit: ${(serpResearch.content_gaps || []).join(", ")}\n- Competitor weaknesses: ${(serpResearch.competitor_weaknesses || []).join(", ")}\n- FAQ questions to answer: ${(serpResearch.faq_questions || []).join(", ")}\n- Unique angles: ${(serpResearch.unique_angles || []).join(", ")}\n- Target word count: ${serpResearch.recommended_word_count || 2500}+\n- Common headings competitors use: ${(serpResearch.common_headings || []).join(", ")}\n\nCRITICAL: Your article MUST cover everything competitors cover PLUS the content gaps. Be more comprehensive, more actionable, and more expert than all competitors.` : ""}${strategy ? `\n\nCONTENT STRATEGY:\n${JSON.stringify(strategy)}` : ""}\n\nIMPORTANT: Include exactly two image placeholders {{IMAGE_1}} and {{IMAGE_2}} placed at natural visual break points within the article body. Write in Markdown format.` },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      await supabase.from("agent_runs").update({ status: "error", error_message: `AI error: ${response.status}`, completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limited" : "AI error" }), { status: response.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";

    // Generate 2 in-body images with brand-aware prompts
    const imgDefaults = brand?.image_defaults || {};
    const imgStyle = imgDefaults.style || "modern editorial";
    const imgPalette = imgDefaults.color_palette || "";
    const paletteNote = imgPalette ? ` Use a ${imgPalette} color palette.` : "";

    const imagePrompts = [
      `Generate a professional blog illustration for an article about "${title || keyword}". The image should visually explain a key concept related to "${keyword}". Style: ${imgStyle}. No text in the image, 16:9 aspect ratio.${paletteNote} Ultra high resolution.`,
      `Generate a different professional blog illustration for "${title || keyword}". Show a practical example, diagram, or scenario related to "${keyword}". Style: ${imgStyle}. No text, 16:9 aspect ratio.${paletteNote} Ultra high resolution.`,
    ];

    const imageUrls: string[] = [];

    for (let i = 0; i < imagePrompts.length; i++) {
      try {
        console.log(`Generating body image ${i + 1} for: ${title || keyword}`);
        const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: imagePrompts[i] }],
            modalities: ["image", "text"],
          }),
        });

        if (!imgRes.ok) {
          console.warn(`Body image ${i + 1} generation failed: ${imgRes.status}`);
          imageUrls.push("");
          continue;
        }

        const imgResult = await imgRes.json();
        const imageData = imgResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          imageUrls.push("");
          continue;
        }

        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          imageUrls.push("");
          continue;
        }

        const imageFormat = base64Match[1];
        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        const fileName = `${userId}/${contentItemId || crypto.randomUUID()}-body-${i + 1}.${imageFormat}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("content-images")
          .upload(fileName, binaryData, {
            contentType: `image/${imageFormat}`,
            upsert: true,
          });

        if (uploadError) {
          console.warn(`Body image ${i + 1} upload failed:`, uploadError.message);
          imageUrls.push("");
          continue;
        }

        const { data: publicUrlData } = supabaseAdmin.storage
          .from("content-images")
          .getPublicUrl(fileName);

        imageUrls.push(publicUrlData.publicUrl);
        console.log(`Body image ${i + 1} uploaded:`, publicUrlData.publicUrl);
      } catch (imgErr) {
        console.warn(`Body image ${i + 1} error:`, imgErr);
        imageUrls.push("");
      }
    }

    // Replace image placeholders with actual markdown images
    if (imageUrls[0]) {
      content = content.replace("{{IMAGE_1}}", `![${keyword} - visual guide](${imageUrls[0]})`);
    } else {
      content = content.replace("{{IMAGE_1}}", "");
    }
    if (imageUrls[1]) {
      content = content.replace("{{IMAGE_2}}", `![${keyword} - practical example](${imageUrls[1]})`);
    } else {
      content = content.replace("{{IMAGE_2}}", "");
    }

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
        brand_id: brandId || brand?.id || null,
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
      result: { content_length: content.length, content_item_id: contentItemId, body_images: imageUrls.filter(Boolean).length, brand: brand?.name || null },
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
