import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { domain, userId } = await req.json();
    if (!domain || !userId) throw new Error("domain and userId required");

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

    // Use AI to analyze the domain
    const prompt = `Analyze the SEO strategy of the domain "${domain}".
${scrapedContent ? `Here is the scraped content of their homepage (first 3000 chars):\n${scrapedContent.substring(0, 3000)}` : "No scraped content available — provide estimates based on the domain name."}

Provide a comprehensive SEO analysis in JSON format:
{
  "summary": "2-3 sentence overview of their SEO strategy",
  "keywords": ["top", "estimated", "keywords", "they", "target"],
  "schema_types": ["Article", "Organization", "etc"],
  "meta_patterns": {
    "title": "their title tag pattern",
    "description": "their meta description pattern"
  },
  "content_types": ["blog", "landing page", "etc"],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}`;

    const aiRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-gateway`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData?.choices?.[0]?.message?.content || "";

    let analysis: any = {};
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
    } catch {
      analysis = { summary: text.substring(0, 500) };
    }

    // Store the scan
    const scanRow = {
      user_id: userId,
      domain,
      scan_results: { summary: analysis.summary || "", strengths: analysis.strengths || [], weaknesses: analysis.weaknesses || [], content_types: analysis.content_types || [] },
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
