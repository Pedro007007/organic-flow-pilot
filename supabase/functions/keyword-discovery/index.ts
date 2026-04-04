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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { gscData, brandId } = await req.json();

    // Log agent run start
    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Keyword Discovery",
      agent_description: "Identifies high-value keyword opportunities",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Gather context: brands, existing keywords, existing content
    const { data: brands } = await supabase.from("brands").select("name, domain, tone_of_voice, seo_settings").eq("user_id", userId);
    const { data: existingKeywords } = await supabase.from("keywords").select("keyword").eq("user_id", userId);
    const { data: existingContent } = await supabase.from("content_items").select("keyword, title").eq("user_id", userId).limit(50);

    const existingKwList = (existingKeywords || []).map(k => k.keyword);
    const brandContext = (brands || []).map(b => `- ${b.name} (${b.domain || "no domain"}): ${b.tone_of_voice || "professional"}`).join("\n");
    const contentContext = (existingContent || []).map(c => `- "${c.title}" (keyword: ${c.keyword})`).join("\n");

    const hasGscData = gscData && Array.isArray(gscData) && gscData.length > 0;

    const systemPrompt = `You are a Senior SEO Research Analyst. Your job is to discover high-value keyword opportunities.

${hasGscData ? "Analyze the provided Google Search Console data to identify opportunities." : "Research and suggest keyword opportunities based on the brand context provided."}

Rules:
- Suggest 8-15 keyword opportunities
- Prioritise keywords that would rank in positions 8–30 (striking distance)
- Group keywords into clusters by topic
- Intent matters more than volume
- Classify search intent: informational, commercial, transactional, local
- Score opportunity: low, medium, high
- Suggest content types: blog, landing_page, guide, faq
- DO NOT suggest keywords that already exist: ${existingKwList.slice(0, 50).join(", ") || "none yet"}
- Include realistic estimated impressions and positions

Brand context:
${brandContext || "No brands configured yet"}

Existing content:
${contentContext || "No content yet"}`;

    const userMessage = hasGscData
      ? `Analyze this GSC data and return keyword opportunities:\n${JSON.stringify(gscData)}`
      : `Based on the brand context above, research and suggest keyword opportunities. Think about what potential customers would search for. Consider long-tail keywords, question-based queries, and commercial intent terms.`;

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
            name: "return_keywords",
            description: "Return discovered keyword opportunities",
            parameters: {
              type: "object",
              properties: {
                keywords: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      keyword: { type: "string" },
                      search_intent: { type: "string", enum: ["informational", "commercial", "transactional", "local"] },
                      impressions: { type: "number" },
                      clicks: { type: "number" },
                      ctr: { type: "number" },
                      position: { type: "number" },
                      opportunity: { type: "string", enum: ["low", "medium", "high"] },
                      content_type: { type: "string", enum: ["blog", "landing_page", "guide", "faq"] },
                      supporting_keywords: { type: "array", items: { type: "string" } },
                      notes: { type: "string" },
                    },
                    required: ["keyword", "search_intent", "opportunity", "content_type"],
                  },
                },
              },
              required: ["keywords"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_keywords" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        await supabase.from("agent_runs").update({ status: "error", error_message: "Rate limited", completed_at: new Date().toISOString() }).eq("id", run?.id);
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let keywords: any[] = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      keywords = parsed.keywords || [];
    }

    console.log(`Discovered ${keywords.length} keywords`);

    // Save keywords to DB (skip duplicates)
    let inserted = 0;
    for (const kw of keywords) {
      if (existingKwList.includes(kw.keyword)) continue;
      const { error: insertError } = await supabase.from("keywords").insert({
        user_id: userId,
        keyword: kw.keyword,
        search_intent: kw.search_intent || "informational",
        impressions: kw.impressions || 0,
        clicks: kw.clicks || 0,
        ctr: kw.ctr || 0,
        position: kw.position || 0,
        opportunity: kw.opportunity || "medium",
        content_type: kw.content_type || "blog",
        supporting_keywords: kw.supporting_keywords || [],
        notes: kw.notes || "",
      });
      if (!insertError) inserted++;
      else console.error("Insert error for keyword:", kw.keyword, insertError.message);
    }

    // Update agent run
    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: inserted,
      completed_at: new Date().toISOString(),
      result: { keywords_found: inserted },
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, keywords_found: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("keyword-discovery error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
