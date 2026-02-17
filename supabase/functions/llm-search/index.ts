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

    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "prompt is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Call AI to extract search queries
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert search research assistant. Given a topic, generate the exact search queries a user or AI model would use to research this topic comprehensively. Include informational, commercial, navigational, and long-tail variants. Return structured data using the provided tool.`,
          },
          {
            role: "user",
            content: `Topic: ${prompt}\n\nGenerate 10-20 diverse search queries that would be used to research this topic. Include different intents and long-tail variations.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_queries",
              description: "Return extracted search queries with metadata",
              parameters: {
                type: "object",
                properties: {
                  queries: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        query: { type: "string", description: "The search query" },
                        intent: { type: "string", enum: ["informational", "commercial", "transactional", "navigational"] },
                        volume_tier: { type: "string", enum: ["high", "medium", "low"] },
                        reasoning: { type: "string", description: "Why this query matters" },
                      },
                      required: ["query", "intent", "volume_tier", "reasoning"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["queries"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_queries" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let queries: any[] = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      queries = parsed.queries || [];
    }

    // Cross-reference against user's keywords table
    const { data: userKeywords } = await supabase
      .from("keywords")
      .select("keyword, search_intent, impressions, position, clicks");

    const keywordList = userKeywords || [];
    const keywordMatches = queries.map((q: any) => {
      const queryLower = q.query.toLowerCase();
      let matchType = "gap";
      let matchedKeyword: any = null;

      for (const kw of keywordList) {
        const kwLower = kw.keyword.toLowerCase();
        if (kwLower === queryLower) {
          matchType = "matched";
          matchedKeyword = kw;
          break;
        }
        if (queryLower.includes(kwLower) || kwLower.includes(queryLower)) {
          matchType = "partial";
          matchedKeyword = kw;
        }
      }

      return {
        ...q,
        match_type: matchType,
        matched_keyword: matchedKeyword
          ? {
              keyword: matchedKeyword.keyword,
              intent: matchedKeyword.search_intent,
              impressions: matchedKeyword.impressions,
              position: matchedKeyword.position,
              clicks: matchedKeyword.clicks,
            }
          : null,
      };
    });

    // Save session
    await supabase.from("llm_search_sessions").insert({
      user_id: user.id,
      prompt,
      queries,
      keyword_matches: keywordMatches,
    });

    return new Response(JSON.stringify({ success: true, queries: keywordMatches }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("llm-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
