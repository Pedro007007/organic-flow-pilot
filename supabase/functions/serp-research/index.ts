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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { keyword, limit, contentItemId } = await req.json();
    if (!keyword) {
      return new Response(JSON.stringify({ error: "keyword is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Log agent run
    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "SERP Research",
      agent_description: "Searches Google via Firecrawl and analyses top-ranking pages",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    // Step 1: Firecrawl Search
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      await supabase.from("agent_runs").update({ status: "error", error_message: "FIRECRAWL_API_KEY not configured", completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: "Firecrawl connector not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("Searching Google for:", keyword);
    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: keyword,
        limit: limit || 10,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("Firecrawl error:", searchRes.status, errText);
      await supabase.from("agent_runs").update({ status: "error", error_message: `Firecrawl error: ${searchRes.status}`, completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: searchRes.status === 429 ? "Firecrawl rate limited" : "Firecrawl search failed" }), { status: searchRes.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const searchData = await searchRes.json();
    const results = searchData.data || [];
    console.log(`Found ${results.length} SERP results`);

    // Step 2: Extract structured data from each result
    const competitors = results.map((r: any, i: number) => {
      const markdown = r.markdown || "";
      const headings = markdown.match(/^#{1,3}\s+.+$/gm) || [];
      const wordCount = markdown.split(/\s+/).length;
      const faqPatterns = markdown.match(/\?/g)?.length || 0;

      return {
        position: i + 1,
        url: r.url || "",
        title: r.title || "",
        wordCount,
        headings: headings.slice(0, 20),
        faqCount: faqPatterns,
        snippet: markdown.slice(0, 500),
      };
    });

    // Step 3: Send to Gemini for competitive analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const analysisPrompt = `Analyse the top ${competitors.length} Google results for the keyword "${keyword}".

Here is the extracted data from each ranking page:

${competitors.map((c: any) => `
### Position ${c.position}: ${c.title}
URL: ${c.url}
Word count: ${c.wordCount}
Headings: ${c.headings.join(" | ")}
FAQ signals: ${c.faqCount}
Content preview: ${c.snippet}
`).join("\n---\n")}

Provide a competitive content brief.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an SEO Competitive Analyst. Analyse SERP data and return structured competitive intelligence." },
          { role: "user", content: analysisPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_serp_analysis",
            description: "Return the SERP competitive analysis",
            parameters: {
              type: "object",
              properties: {
                common_headings: { type: "array", items: { type: "string" }, description: "H2/H3 headings that appear across multiple top results" },
                content_gaps: { type: "array", items: { type: "string" }, description: "Topics/angles NOT covered by competitors that we should address" },
                avg_word_count: { type: "number" },
                recommended_word_count: { type: "number", description: "Target word count to beat competitors" },
                faq_questions: { type: "array", items: { type: "string" }, description: "FAQ questions we should answer" },
                unique_angles: { type: "array", items: { type: "string" }, description: "Unique angles to differentiate our content" },
                competitor_weaknesses: { type: "array", items: { type: "string" }, description: "Weaknesses in competitor content we can exploit" },
                top_competitors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      title: { type: "string" },
                      word_count: { type: "number" },
                      strengths: { type: "array", items: { type: "string" } },
                    },
                    required: ["url", "title"],
                  },
                },
              },
              required: ["common_headings", "content_gaps", "avg_word_count", "recommended_word_count", "faq_questions", "unique_angles", "competitor_weaknesses"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_serp_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      await supabase.from("agent_runs").update({ status: "error", error_message: `AI error: ${aiRes.status}`, completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: aiRes.status === 429 ? "Rate limited" : aiRes.status === 402 ? "Payment required" : "AI analysis failed" }), { status: aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await aiRes.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let analysis: any = {};
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    }

    // Add raw competitor data to the analysis
    analysis.raw_competitors = competitors;

    // Save to content_items if provided
    if (contentItemId) {
      await supabase.from("content_items").update({
        serp_research: analysis,
      }).eq("id", contentItemId).eq("user_id", userId);
    }

    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: competitors.length,
      completed_at: new Date().toISOString(),
      result: analysis,
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("serp-research error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
