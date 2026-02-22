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

    const { domain } = await req.json();
    if (!domain) throw new Error("domain required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to scrape with Firecrawl if available
    let scrapedContent = "";
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (firecrawlKey) {
      try {
        let formattedUrl = domain.trim();
        if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["markdown"],
            onlyMainContent: false,
          }),
        });

        const scrapeData = await scrapeRes.json();
        scrapedContent = scrapeData?.data?.markdown || scrapeData?.markdown || "";
      } catch (e) {
        console.error("Firecrawl scrape failed:", e);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an expert SEO analyst. Analyze the domain "${domain}" and produce a comprehensive SEO Intelligence Report.
${scrapedContent ? `Here is the scraped homepage content (first 4000 chars):\n${scrapedContent.substring(0, 4000)}` : "No scraped content available — provide realistic estimates based on the domain name and industry inference."}

Return a JSON object with ALL of the following sections. Be specific, realistic, and data-driven. Use realistic numbers.

{
  "summary": "2-3 sentence executive overview of their search revenue opportunity",
  "seo_score": <number 0-100>,
  "score_breakdown": {
    "technical_health": <number 0-100>,
    "on_page": <number 0-100>,
    "backlinks": <number 0-100>,
    "content_authority": <number 0-100>,
    "keyword_positioning": <number 0-100>
  },
  "revenue_opportunity": {
    "current_traffic": <number>,
    "potential_traffic": <number>,
    "missed_clicks_monthly": <number>,
    "conversion_rate": <number like 0.03>,
    "avg_customer_value": <number>,
    "monthly_revenue_estimate": <number>,
    "annual_revenue_potential": <number>,
    "capture_percentage": <number like 18 meaning 18%>
  },
  "technical_audit": [
    { "element": "Mobile Speed", "status": "42/100", "impact": "High", "priority": "Urgent", "details": "..." },
    { "element": "HTTPS", "status": "Active", "impact": "Critical", "priority": "OK", "details": "..." },
    { "element": "Core Web Vitals", "status": "Needs Work", "impact": "High", "priority": "Urgent", "details": "..." },
    { "element": "Indexing Status", "status": "Partial", "impact": "High", "priority": "Fix", "details": "..." },
    { "element": "Crawl Errors", "status": "<number>", "impact": "Medium", "priority": "Fix", "details": "..." },
    { "element": "Sitemap", "status": "Present/Missing", "impact": "Medium", "priority": "...", "details": "..." },
    { "element": "Robots.txt", "status": "Present/Missing", "impact": "Medium", "priority": "...", "details": "..." },
    { "element": "Structured Data", "status": "Partial/None/Full", "impact": "Medium", "priority": "...", "details": "..." }
  ],
  "keyword_opportunities": [
    { "keyword": "...", "volume": <number>, "current_position": <number or null>, "opportunity_score": "High/Medium/Low/Critical", "cpc": <number>, "estimated_value": <number> }
  ],
  "competitor_gap": {
    "domain_authority": <number>,
    "competitor_da": <number>,
    "referring_domains": <number>,
    "competitor_referring_domains": <number>,
    "content_volume": <number>,
    "competitor_content_volume": <number>,
    "keywords_gap_count": <number>,
    "estimated_lost_traffic": <number>,
    "top_competitor_pages": ["page1", "page2", "page3"]
  },
  "content_review": {
    "total_pages": <number>,
    "blog_posts": <number>,
    "thin_pages_count": <number>,
    "duplicate_titles_count": <number>,
    "missing_meta_count": <number>,
    "topic_clusters": ["cluster1", "cluster2"],
    "internal_linking_score": <number 0-100>,
    "content_freshness": "Good/Stale/Mixed"
  },
  "backlink_profile": {
    "total_backlinks": <number>,
    "referring_domains": <number>,
    "toxic_links_percentage": <number>,
    "toxic_risk": "Low/Medium/High",
    "authority_comparison": "Below Average/Average/Above Average",
    "domains_needed": <number>,
    "top_referring": ["domain1.com", "domain2.com"]
  },
  "local_seo": {
    "applicable": <boolean>,
    "gbp_optimized": <boolean>,
    "nap_consistent": <boolean>,
    "reviews_count": <number>,
    "average_rating": <number>,
    "local_keyword_count": <number>,
    "local_visibility_score": <number 0-100>
  },
  "action_plan": {
    "30_day": ["action1", "action2", "action3"],
    "60_day": ["action1", "action2", "action3"],
    "90_day": ["action1", "action2", "action3"]
  },
  "growth_index": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "content_types": ["blog", "landing page", "etc"],
  "keywords": ["top", "estimated", "keywords"],
  "schema_types": ["Article", "Organization", "etc"],
  "meta_patterns": {
    "title": "their title tag pattern",
    "description": "their meta description pattern"
  }
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences. Be specific with numbers. For keyword_opportunities, include 8-12 keywords. For technical_audit, include all 8 elements listed. The growth_index should be a proprietary "Searchera Growth Index™" score blending all metrics.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error("AI analysis failed");
    }

    const aiData = await aiRes.json();
    const text = aiData?.choices?.[0]?.message?.content || "";

    let analysis: any = {};
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
    } catch {
      analysis = { summary: text.substring(0, 500) };
    }

    // Store the scan with enriched data
    const scanRow = {
      user_id: userId,
      domain,
      scan_results: {
        summary: analysis.summary || "",
        seo_score: analysis.seo_score || 0,
        score_breakdown: analysis.score_breakdown || {},
        revenue_opportunity: analysis.revenue_opportunity || {},
        technical_audit: analysis.technical_audit || [],
        keyword_opportunities: analysis.keyword_opportunities || [],
        competitor_gap: analysis.competitor_gap || {},
        content_review: analysis.content_review || {},
        backlink_profile: analysis.backlink_profile || {},
        local_seo: analysis.local_seo || {},
        action_plan: analysis.action_plan || {},
        growth_index: analysis.growth_index || 0,
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        content_types: analysis.content_types || [],
      },
      keywords_found: analysis.keywords || [],
      schema_types: analysis.schema_types || [],
      meta_patterns: analysis.meta_patterns || {},
    };

    const { data: scan, error } = await supabase
      .from("competitor_scans")
      .insert(scanRow)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ scan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("business-scanner error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
