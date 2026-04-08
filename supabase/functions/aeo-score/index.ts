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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = { id: claimsData.claims.sub };

    const { contentItemId } = await req.json();
    if (!contentItemId) {
      return new Response(JSON.stringify({ error: "contentItemId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentItemId)
      .maybeSingle();

    if (!item) {
      return new Response(JSON.stringify({ error: "Content item not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = item.draft_content || "";
    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "No draft content to score" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ANALYSIS_WINDOW_CHARS = 16000;
    const FAQ_SECTION_PATTERN = /(^|\n)##\s+(frequently asked questions|faq|common questions)\b[\s\S]*$/im;
    const getAeoAnalysisWindow = (rawContent: string) => {
      const normalized = rawContent.trim();
      if (normalized.length <= ANALYSIS_WINDOW_CHARS) return normalized;

      const faqMatch = normalized.match(FAQ_SECTION_PATTERN);
      if (faqMatch?.index !== undefined) {
        const faqStart = faqMatch.index;
        const headBudget = Math.max(5000, ANALYSIS_WINDOW_CHARS - (normalized.length - faqStart));
        const head = normalized.slice(0, headBudget).trimEnd();
        const faqTail = normalized.slice(faqStart).trimStart();
        const combined = `${head}\n\n${faqTail}`;
        return combined.length <= ANALYSIS_WINDOW_CHARS
          ? combined
          : `${normalized.slice(0, 8000).trimEnd()}\n\n${normalized.slice(-8000).trimStart()}`;
      }

      return `${normalized.slice(0, 10000).trimEnd()}\n\n${normalized.slice(-6000).trimStart()}`;
    };

    const analysisWindow = getAeoAnalysisWindow(content);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 2500,
        messages: [
          {
            role: "system",
            content: `You are an AEO (Answer Engine Optimization) expert. Analyze content for AI-readiness — how well it can be extracted and cited by AI search engines like ChatGPT, Perplexity, Gemini, and Copilot. Score each dimension 0-100.`,
          },
          {
            role: "user",
            content: `Analyze this content for AEO readiness. Schema types present: ${JSON.stringify(item.schema_types || [])}.\n\nContent:\n${analysisWindow}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "aeo_analysis",
              description: "Return AEO score breakdown and recommendations",
              parameters: {
                type: "object",
                properties: {
                  faq_coverage: { type: "integer", description: "0-100: Does content answer questions in Q+A format?" },
                  answer_blocks: { type: "integer", description: "0-100: Are there TL;DR, key takeaways, summaries?" },
                  entity_clarity: { type: "integer", description: "0-100: Are key entities explicitly defined?" },
                  schema_richness: { type: "integer", description: "0-100: FAQPage, HowTo, QAPage schemas present?" },
                  conciseness: { type: "integer", description: "0-100: Are answers under 50 words, extractable by AI?" },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dimension: { type: "string" },
                        issue: { type: "string" },
                        fix: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["dimension", "issue", "fix", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["faq_coverage", "answer_blocks", "entity_clarity", "schema_richness", "conciseness", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "aeo_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No AEO analysis returned");

    const analysis = JSON.parse(toolCall.function.arguments);
    const overall = Math.round(
      analysis.faq_coverage * 0.25 +
      analysis.answer_blocks * 0.20 +
      analysis.entity_clarity * 0.20 +
      analysis.schema_richness * 0.20 +
      analysis.conciseness * 0.15
    );

    const scores = {
      faq_coverage: analysis.faq_coverage,
      answer_blocks: analysis.answer_blocks,
      entity_clarity: analysis.entity_clarity,
      schema_richness: analysis.schema_richness,
      conciseness: analysis.conciseness,
    };

    // Upsert AEO score
    const { data: existing } = await supabase
      .from("aeo_scores")
      .select("id")
      .eq("content_item_id", contentItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("aeo_scores").update({
        overall_score: overall,
        scores,
        recommendations: analysis.recommendations,
        created_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("aeo_scores").insert({
        content_item_id: contentItemId,
        user_id: user.id,
        overall_score: overall,
        scores,
        recommendations: analysis.recommendations,
      });
    }

    // Also update the content_items.seo_score so the pipeline card reflects the latest score
    await supabase.from("content_items").update({ seo_score: overall }).eq("id", contentItemId);

    return new Response(JSON.stringify({
      success: true,
      overall_score: overall,
      scores,
      recommendations: analysis.recommendations,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("aeo-score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
