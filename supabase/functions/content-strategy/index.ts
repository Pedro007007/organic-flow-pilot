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

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const { keyword, searchIntent, supportingKeywords } = await req.json();
    if (!keyword) {
      return new Response(JSON.stringify({ error: "keyword is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Content Strategy",
      agent_description: "Turns keywords into structured content plans",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a Senior SEO Content Strategist. Turn keywords into rankable, conversion-supporting content plans.

Rules:
- Every article must support a business goal
- Avoid generic blog topics
- Structure for both humans and AI search engines
- Content must fit into a topic cluster
- Create CTR-optimised title options
- Define page structure (H1–H3)
- Identify FAQs to win featured snippets
- Plan internal links`;

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
          { role: "user", content: `Create a content strategy for:\nKeyword: ${keyword}\nIntent: ${searchIntent || "informational"}\nSupporting keywords: ${(supportingKeywords || []).join(", ")}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_strategy",
            description: "Return the content strategy",
            parameters: {
              type: "object",
              properties: {
                seo_titles: { type: "array", items: { type: "string" } },
                primary_h1: { type: "string" },
                outline: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      h2: { type: "string" },
                      h3: { type: "array", items: { type: "string" } },
                    },
                    required: ["h2"],
                  },
                },
                faq_questions: { type: "array", items: { type: "string" } },
                internal_links: { type: "array", items: { type: "string" } },
                content_goal: { type: "string" },
              },
              required: ["seo_titles", "primary_h1", "outline", "faq_questions", "content_goal"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_strategy" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      await supabase.from("agent_runs").update({ status: "error", error_message: `AI error: ${response.status}`, completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limited" : "AI error" }), { status: response.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let strategy = {};
    if (toolCall?.function?.arguments) {
      strategy = JSON.parse(toolCall.function.arguments);
    }

    // Create content item in strategy stage
    const title = (strategy as any).seo_titles?.[0] || `Article: ${keyword}`;
    await supabase.from("content_items").insert({
      user_id: userId,
      title,
      keyword,
      status: "strategy",
      seo_title: title,
    });

    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: 1,
      completed_at: new Date().toISOString(),
      result: strategy,
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, strategy }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-strategy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
