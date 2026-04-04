import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const buildCtaParagraph = (brand: any) => {
  if (brand?.cta_text) return brand.cta_text;
  const brandName = brand?.name || "us";
  const brandDomain = brand?.domain ? (brand.domain.startsWith("http") ? brand.domain : `https://${brand.domain}`) : null;
  return brandDomain
    ? `---\n\n*Ready to grow your online presence? Contact [${brandName}](${brandDomain}) today to discover how our expert SEO and content strategies can help your business reach more customers.*`
    : `---\n\n*Ready to grow your online presence? Contact ${brandName} today to discover how our expert SEO and content strategies can help your business reach more customers.*`;
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { contentItemId, draftContent, maxLinks: rawMaxLinks, targetSections } = await req.json();
    if (!contentItemId || !draftContent) {
      return new Response(JSON.stringify({ error: "contentItemId and draftContent required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const requestedMaxLinks = Math.min(Math.max(Number(rawMaxLinks) || 8, 3), 20);
    const sectionTargets: string[] | null = Array.isArray(targetSections) && targetSections.length > 0 ? targetSections : null;

    const { data: item } = await supabase.from("content_items").select("brand_id, keyword, title").eq("id", contentItemId).eq("user_id", userId).maybeSingle();
    if (!item) {
      return new Response(JSON.stringify({ error: "Content item not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let brand: any = null;
    if (item.brand_id) {
      const { data } = await supabase.from("brands").select("*").eq("id", item.brand_id).eq("user_id", userId).maybeSingle();
      brand = data;
    }
    if (!brand) {
      const { data } = await supabase.from("brands").select("*").eq("user_id", userId).eq("is_default", true).maybeSingle();
      brand = data;
    }

    const resolvedBrandId = item.brand_id || brand?.id;
    const preferredDomain = brand?.domain || null;
    const normalizedDraftContent = normalizeMarkdownLinks(draftContent, preferredDomain);

    let sitemapQuery = supabase.from("sitemap_pages").select("url, title").eq("user_id", userId).limit(50);
    if (resolvedBrandId) sitemapQuery = sitemapQuery.eq("brand_id", resolvedBrandId);
    let { data: sitemapPages } = await sitemapQuery;

    if ((!sitemapPages || sitemapPages.length === 0) && resolvedBrandId) {
      const { data: fallback } = await supabase.from("sitemap_pages").select("url, title").eq("user_id", userId).limit(50);
      sitemapPages = fallback;
    }

    const { data: existingContent } = await supabase
      .from("content_items")
      .select("title, keyword, slug, url")
      .eq("user_id", userId)
      .in("status", ["published", "monitoring"])
      .neq("id", contentItemId)
      .or("url.not.is.null,slug.not.is.null")
      .limit(20);

    const seen = new Set<string>();
    const candidates: { title: string; url: string; keyword?: string }[] = [];

    for (const sp of sitemapPages || []) {
      const resolvedUrl = resolveAbsoluteUrl(sp.url, preferredDomain);
      if (resolvedUrl && !seen.has(resolvedUrl)) {
        seen.add(resolvedUrl);
        candidates.push({ title: sp.title || resolvedUrl, url: resolvedUrl });
      }
    }

    for (const c of (existingContent || []) as any[]) {
      const u = resolveAbsoluteUrl(c.url || (c.slug ? `/blog/${c.slug}` : null), preferredDomain);
      if (u && !seen.has(u)) {
        seen.add(u);
        candidates.push({ title: c.title, url: u, keyword: c.keyword });
      }
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No internal link candidates found. Sync your sitemap or create more content first." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cappedCandidates = candidates.slice(0, 30);
    const linkList = cappedCandidates.map(l => `- [${l.title}](${l.url})${l.keyword ? ` — about "${l.keyword}"` : ""}`).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sectionRule = sectionTargets
      ? `- PRIORITISE placing links in these sections: ${sectionTargets.map(s => `"${s}"`).join(", ")}. Place most links in these sections, but you may also add a few elsewhere if contextually appropriate.`
      : "- Spread links across different sections of the article — NOT clustered in one area";

    const systemPrompt = `You are an expert SEO editor specialising in internal linking. Your job is to take an existing article and weave in internal links from the provided candidate list.

RULES:
- Insert up to ${requestedMaxLinks} internal links total using natural, contextually relevant anchor text
${sectionRule}
- Do NOT duplicate any links that are already present in the article
- Do NOT remove, rewrite, or alter any existing content, images, headings, or formatting
- Do NOT add new paragraphs or content — only insert hyperlinks into existing text
- Do NOT modify, rewrite, or remove the final CTA paragraph (the one mentioning "PJ Media Magnet Ltd" and searcheraa.com). Leave it exactly as-is.
- Use markdown link format: [anchor text](url)
- Choose anchors that flow naturally in the sentence
- Every link must be contextually relevant to the surrounding text
- Return the COMPLETE article with the links inserted — not just the changed parts`;

    const userPrompt = `Here is the article to upgrade with internal links:

---
${normalizedDraftContent}
---

AVAILABLE INTERNAL LINK CANDIDATES:
${linkList}

Insert up to ${requestedMaxLinks} of these links into the article using natural anchor text. Return the complete article with links inserted.`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limited — try again shortly" : "AI error" }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    let upgradedContent = aiResult.choices?.[0]?.message?.content || "";

    if (!upgradedContent || upgradedContent.length < 100) {
      return new Response(JSON.stringify({ error: "AI returned empty or too-short content" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    upgradedContent = normalizeMarkdownLinks(upgradedContent, preferredDomain);
    upgradedContent = upgradedContent.replace(/\n---\n[\s\S]*PJ Media Magnet[\s\S]*$/i, "").trimEnd();
    upgradedContent = upgradedContent.replace(/\n\n\*[^*]*PJ Media Magnet[^*]*\*\s*$/i, "").trimEnd();
    upgradedContent = upgradedContent.trimEnd() + "\n\n" + CTA_PARAGRAPH;

    await supabase.from("content_items").update({
      draft_content: upgradedContent,
    }).eq("id", contentItemId).eq("user_id", userId);

    return new Response(JSON.stringify({ success: true, content: upgradedContent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("upgrade-internal-links error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
