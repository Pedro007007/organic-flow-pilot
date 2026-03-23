import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CTA_PARAGRAPH = `---

*If you are a business owner in the renewable sector or a local Surrey installer looking to reach more customers, let's talk about how to grow your reach. Contact [PJ Media Magnet Ltd](https://searcheraa.com/) today to discover how our expert SEO and content strategies can put your business at the forefront of the green energy revolution.*`;

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

    const { contentItemId, draftContent } = await req.json();
    if (!contentItemId || !draftContent) {
      return new Response(JSON.stringify({ error: "contentItemId and draftContent required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load content item for brand context
    const { data: item } = await supabase.from("content_items").select("brand_id, keyword, title").eq("id", contentItemId).eq("user_id", userId).maybeSingle();
    if (!item) {
      return new Response(JSON.stringify({ error: "Content item not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load brand
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

    // Fetch internal link candidates: sitemap pages
    let sitemapQuery = supabase.from("sitemap_pages").select("url, title").eq("user_id", userId).limit(50);
    if (resolvedBrandId) sitemapQuery = sitemapQuery.eq("brand_id", resolvedBrandId);
    let { data: sitemapPages } = await sitemapQuery;

    // Fallback if brand-specific returned nothing
    if ((!sitemapPages || sitemapPages.length === 0) && resolvedBrandId) {
      const { data: fallback } = await supabase.from("sitemap_pages").select("url, title").eq("user_id", userId).limit(50);
      sitemapPages = fallback;
    }

    // Fetch content items with slugs
    const { data: existingContent } = await supabase
      .from("content_items")
      .select("title, keyword, slug, url")
      .eq("user_id", userId)
      .neq("id", contentItemId)
      .or("url.not.is.null,slug.not.is.null")
      .limit(20);

    // Merge candidates
    const seen = new Set<string>();
    const candidates: { title: string; url: string; keyword?: string }[] = [];

    for (const sp of sitemapPages || []) {
      if (sp.url && !seen.has(sp.url)) {
        seen.add(sp.url);
        candidates.push({ title: sp.title || sp.url, url: sp.url });
      }
    }
    for (const c of (existingContent || []) as any[]) {
      const u = c.url || (c.slug ? `/blog/${c.slug}` : null);
      if (u && !seen.has(u)) {
        seen.add(u);
        candidates.push({ title: c.title, url: u, keyword: c.keyword });
      }
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No internal link candidates found. Sync your sitemap or create more content first." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cappedCandidates = candidates.slice(0, 24);
    const linkList = cappedCandidates.map(l => `- [${l.title}](${l.url})${l.keyword ? ` — about "${l.keyword}"` : ""}`).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert SEO editor specialising in internal linking. Your job is to take an existing article and weave in internal links from the provided candidate list.

RULES:
- Insert up to 7-8 internal links total using natural, contextually relevant anchor text
- Spread links across different sections of the article — NOT clustered in one area
- Do NOT duplicate any links that are already present in the article
- Do NOT remove, rewrite, or alter any existing content, images, headings, or formatting
- Do NOT add new paragraphs or content — only insert hyperlinks into existing text
- Use markdown link format: [anchor text](url)
- Choose anchors that flow naturally in the sentence
- Every link must be contextually relevant to the surrounding text
- Return the COMPLETE article with the links inserted — not just the changed parts`;

    const userPrompt = `Here is the article to upgrade with internal links:

---
${draftContent}
---

AVAILABLE INTERNAL LINK CANDIDATES:
${linkList}

Insert up to 7-8 of these links into the article using natural anchor text. Return the complete article with links inserted.`;

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

    // Enforce CTA at the end
    if (!upgradedContent.includes("Contact PJ Media Magnet Ltd today")) {
      upgradedContent = upgradedContent.trimEnd() + "\n\n" + CTA_PARAGRAPH;
    }

    // Save to DB
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
