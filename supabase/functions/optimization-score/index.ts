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

    const { contentItemId } = await req.json();
    if (!contentItemId) {
      return new Response(JSON.stringify({ error: "contentItemId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch content item
    const { data: item, error: itemError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentItemId)
      .maybeSingle();

    if (itemError || !item) {
      return new Response(JSON.stringify({ error: "Content item not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create optimization job (pending)
    const { data: job, error: jobError } = await supabase
      .from("optimization_jobs")
      .insert({
        user_id: userId,
        content_item_id: contentItemId,
        status: "running",
      })
      .select("id")
      .single();

    if (jobError) throw jobError;

    // Fetch brand settings
    let brand: any = null;
    if (item.brand_id) {
      const { data } = await supabase.from("brands").select("*").eq("id", item.brand_id).eq("user_id", userId).maybeSingle();
      brand = data;
    }
    if (!brand) {
      const { data } = await supabase.from("brands").select("*").eq("user_id", userId).eq("is_default", true).maybeSingle();
      brand = data;
    }

    // Fetch sitemap pages for internal linking analysis
    let sitemapPages: string[] = [];
    if (brand?.id) {
      const { data: pages } = await supabase.from("sitemap_pages").select("url").eq("brand_id", brand.id).limit(50);
      sitemapPages = (pages || []).map((p: any) => p.url);
    }
    // Fallback: if brand-specific query returned nothing, try all user sitemap pages
    if (sitemapPages.length === 0) {
      const { data: fallbackPages } = await supabase.from("sitemap_pages").select("url").eq("user_id", userId).limit(50);
      sitemapPages = (fallbackPages || []).map((p: any) => p.url);
    }

    // Also include content items with slugs as valid internal link targets
    const { data: contentLinks } = await supabase
      .from("content_items")
      .select("slug, url")
      .eq("user_id", userId)
      .neq("id", contentItemId)
      .or("url.not.is.null,slug.not.is.null")
      .limit(30);
    const contentLinkUrls = (contentLinks || []).map((c: any) => c.url || `/blog/${c.slug}`);
    const allInternalLinkTargets = [...new Set([...sitemapPages, ...contentLinkUrls])];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const content = item.draft_content || "";

    // Pre-count internal links in content for accurate scoring
    const brandDomain = brand?.domain?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "";
    // Detect markdown links, HTML href, and bare anchor tags
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)|href=["']([^"']+)["']|<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let linkMatch;
    const foundInternalLinks: { anchor: string; url: string }[] = [];
    const foundExternalLinks: string[] = [];
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      const anchor = linkMatch[1] || linkMatch[5] || "";
      const url = (linkMatch[2] || linkMatch[3] || linkMatch[4] || "").trim();
      if (!url) continue;
      const cleanUrl = url.replace(/\s+/g, "");
      const isInternal =
        cleanUrl.startsWith("/") ||
        cleanUrl.startsWith("#") ||
        cleanUrl.startsWith("./") ||
        (brandDomain && cleanUrl.includes(brandDomain)) ||
        cleanUrl.includes("/blog/") ||
        allInternalLinkTargets.some((t) => {
          const normalT = t.replace(/\/$/, "");
          const normalU = cleanUrl.replace(/\/$/, "");
          return normalU.includes(normalT) || normalT.includes(normalU) || normalU.endsWith(normalT.split("/").pop() || "___");
        });
      if (isInternal) {
        foundInternalLinks.push({ anchor, url: cleanUrl });
      } else if (cleanUrl.startsWith("http")) {
        foundExternalLinks.push(cleanUrl);
      }
    }

    const internalLinkSummary = foundInternalLinks.length > 0
      ? `\nPre-counted internal links found in content (${foundInternalLinks.length} total):\n${foundInternalLinks.map((l) => `  - "${l.anchor}" → ${l.url}`).join("\n")}`
      : "\nPre-counted internal links: 0 found in content.";

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const sentenceCount = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length;
    const avgSentenceLength = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const paragraphCount = content.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0).length;
    const h2Count = (content.match(/^##\s/gm) || []).length;
    const h3Count = (content.match(/^###\s/gm) || []).length;
    const hasFaq = /faq|frequently asked/i.test(content);
    const hasTldr = /tl;?dr|key takeaway|summary/i.test(content);
    const bulletListCount = (content.match(/^[-*]\s/gm) || []).length;
    const numberedListCount = (content.match(/^\d+\.\s/gm) || []).length;

    const systemPrompt = `You are an SEO Content Scoring Expert. Analyze the provided content and return a detailed SEO score with an action plan.

IMPORTANT: Use the pre-counted metrics below as your PRIMARY source of truth. Do NOT recount these yourself.

Pre-counted content metrics:
- Word count: ${wordCount}
- Sentence count: ${sentenceCount}
- Average sentence length: ${avgSentenceLength} words
- Paragraph count: ${paragraphCount}
- H2 headings: ${h2Count}
- H3 headings: ${h3Count}
- Bullet list items: ${bulletListCount}
- Numbered list items: ${numberedListCount}
- Has FAQ section: ${hasFaq ? "Yes" : "No"}
- Has TL;DR / Key Takeaways: ${hasTldr ? "Yes" : "No"}

Score the content across these 5 dimensions (each 0-100):

1. Technical SEO (25% weight) — meta title length (50-60 chars ideal), meta description quality (150-160 chars), schema types present, URL slug keyword-rich and clean.

2. On-Page SEO (25% weight) — keyword in H1/title, keyword density (1-2% ideal), proper H2/H3 hierarchy, keyword in first 100 words, keyword in meta description.

3. Readability (20% weight) — USE THE PRE-COUNTED METRICS. Scoring guide:
   - Average sentence length ≤15 words AND paragraph count ≥10 AND bullet/numbered lists ≥5 = 90-100
   - Average sentence length ≤18 words AND paragraph count ≥8 AND some lists = 75-89
   - Average sentence length ≤22 words AND paragraph count ≥6 = 60-74
   - Average sentence length >22 words OR paragraph count <6 = 40-59
   - Award bonus for: short paragraphs (2-4 sentences each), varied sentence lengths, transition words, subheadings every 200-300 words
   - Deduct for: walls of text, jargon-heavy passages, passive voice overuse

4. Internal Linking (15% weight) — IMPORTANT: Use ONLY the pre-counted link data below as the source of truth. Do NOT recount links yourself. Scoring guide: 1-2 internal links = 40-50, 3-4 = 55-65, 5-7 = 70-80, 8-10 = 80-90, 11+ = 90-100. Award bonus for descriptive anchor text, links distributed across multiple sections, and links to topically relevant pages. Deduct only if anchors are generic or all links are clustered in one section.

5. Content Depth (15% weight) — USE THE PRE-COUNTED METRICS. Scoring guide:
   - Word count ≥2500 AND H2 ≥6 AND H3 ≥4 AND has FAQ AND has TL;DR = 90-100
   - Word count ≥2000 AND H2 ≥5 AND H3 ≥3 AND (has FAQ OR has TL;DR) = 75-89
   - Word count ≥1500 AND H2 ≥4 AND H3 ≥2 = 60-74
   - Word count ≥1000 AND H2 ≥3 = 45-59
   - Word count <1000 OR H2 <3 = 25-44
   - Award bonus for: data/statistics, examples, comparisons, expert quotes, actionable advice, comprehensive topic coverage
   - Deduct for: surface-level treatment, repetitive content, missing subtopics

Also generate a prioritized action plan (max 8 items) with effort (low/medium/high) and impact (low/medium/high) labels. Focus actions on the LOWEST scoring dimensions first.

${brand ? `Brand: ${brand.name}${brand.domain ? ` (${brand.domain})` : ""}` : ""}
${allInternalLinkTargets.length > 0 ? `\nKnown internal link targets:\n${allInternalLinkTargets.slice(0, 30).join("\n")}` : ""}`;

    const userMessage = `Analyze this content for SEO optimization scoring.

Keyword: ${item.keyword}
Title: ${item.title}
SEO Title: ${item.seo_title || "(not set)"}
Meta Description: ${item.meta_description || "(not set)"}
Slug: ${item.slug || "(not set)"}
Schema Types: ${(item.schema_types || []).join(", ") || "(none)"}
${internalLinkSummary}
External links found: ${foundExternalLinks.length}

Content:
${content.substring(0, 10000)}`;

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
          { role: "user", content: userMessage },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_optimization_score",
            description: "Return SEO optimization scores and action plan",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "integer", description: "Overall weighted SEO score 0-100" },
                scores: {
                  type: "object",
                  properties: {
                    technical: { type: "integer", description: "Technical SEO score 0-100" },
                    on_page: { type: "integer", description: "On-Page SEO score 0-100" },
                    readability: { type: "integer", description: "Readability score 0-100" },
                    internal_links: { type: "integer", description: "Internal Linking score 0-100" },
                    content_depth: { type: "integer", description: "Content Depth score 0-100" },
                  },
                  required: ["technical", "on_page", "readability", "internal_links", "content_depth"],
                },
                action_plan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      dimension: { type: "string", enum: ["technical", "on_page", "readability", "internal_links", "content_depth"] },
                      effort: { type: "string", enum: ["low", "medium", "high"] },
                      impact: { type: "string", enum: ["low", "medium", "high"] },
                      priority: { type: "integer" },
                    },
                    required: ["action", "dimension", "effort", "impact", "priority"],
                  },
                },
              },
              required: ["overall_score", "scores", "action_plan"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_optimization_score" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      await supabase.from("optimization_jobs").update({ status: "error", error_message: `AI error: ${response.status}` }).eq("id", job.id);
      return new Response(JSON.stringify({ error: "AI scoring failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let result: any = {};
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    }

    const overallScore = Math.max(0, Math.min(100, result.overall_score || 0));

    // Update optimization job
    await supabase.from("optimization_jobs").update({
      status: "completed",
      overall_score: overallScore,
      scores: result.scores || {},
      action_plan: result.action_plan || [],
      completed_at: new Date().toISOString(),
    }).eq("id", job.id);

    // Update content item with seo_score
    await supabase.from("content_items").update({
      seo_score: overallScore,
    }).eq("id", contentItemId).eq("user_id", userId);

    return new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      overall_score: overallScore,
      scores: result.scores,
      action_plan: result.action_plan,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("optimization-score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
