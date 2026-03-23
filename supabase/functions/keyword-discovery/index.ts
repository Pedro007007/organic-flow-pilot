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

    const { gscData } = await req.json();

    // Log agent run start
    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Keyword Discovery",
      agent_description: "Identifies high-value keyword opportunities from GSC data",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a Senior SEO Research Analyst. Analyze the provided Google Search Console data and identify high-value keyword opportunities.

Rules:
- Prefer keywords with existing impressions
- Prioritise keywords ranking positions 8–30
- Group keywords into clusters
- Intent matters more than volume
- Classify search intent: informational, commercial, transactional, local
- Score opportunity: low, medium, high

Return a JSON array of keyword opportunities.`;

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
          { role: "user", content: `Analyze this GSC data and return keyword opportunities as a JSON array with fields: keyword, search_intent, impressions, clicks, ctr, position, opportunity, content_type, supporting_keywords, notes.\n\nGSC Data:\n${JSON.stringify(gscData || [])}` },
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
    let keywords = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      keywords = parsed.keywords || [];
    }

    // Save keywords to DB
    for (const kw of keywords) {
      await supabase.from("keywords").insert({
        user_id: userId,
        keyword: kw.keyword,
        search_intent: kw.search_intent,
        impressions: kw.impressions || 0,
        clicks: kw.clicks || 0,
        ctr: kw.ctr || 0,
        position: kw.position || 0,
        opportunity: kw.opportunity,
        content_type: kw.content_type,
        supporting_keywords: kw.supporting_keywords || [],
        notes: kw.notes || "",
      });
    }

    // Update agent run
    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: keywords.length,
      completed_at: new Date().toISOString(),
      result: { keywords_found: keywords.length },
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, keywords }), {
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
