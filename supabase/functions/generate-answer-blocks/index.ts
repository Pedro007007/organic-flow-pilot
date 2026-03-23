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

    const { contentItemId } = await req.json();
    if (!contentItemId) {
      return new Response(JSON.stringify({ error: "contentItemId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentItemId)
      .maybeSingle();

    if (!item || !item.draft_content?.trim()) {
      return new Response(JSON.stringify({ error: "No content to process" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
        messages: [
          {
            role: "system",
            content: `You are an AEO content optimizer. Generate answer blocks that make content highly extractable by AI search engines. Create a TL;DR (2 sentences max), 5 Key Takeaways (bullet points), and 5 FAQ pairs (question + concise answer under 50 words each).`,
          },
          {
            role: "user",
            content: `Generate answer blocks for this content:\n\n${item.draft_content.slice(0, 8000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_blocks",
              description: "Return structured answer blocks",
              parameters: {
                type: "object",
                properties: {
                  tldr: { type: "string", description: "2 sentence TL;DR summary" },
                  key_takeaways: {
                    type: "array",
                    items: { type: "string" },
                    description: "5 key takeaway bullet points",
                  },
                  faqs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                      },
                      required: ["question", "answer"],
                      additionalProperties: false,
                    },
                    description: "5 FAQ question-answer pairs",
                  },
                },
                required: ["tldr", "key_takeaways", "faqs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_blocks" } },
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
    if (!toolCall?.function?.arguments) throw new Error("No answer blocks returned");

    const blocks = JSON.parse(toolCall.function.arguments);

    // Build markdown answer blocks to append
    let appendContent = "\n\n---\n\n## TL;DR\n\n" + blocks.tldr;
    appendContent += "\n\n## Key Takeaways\n\n";
    for (const t of blocks.key_takeaways) {
      appendContent += `- ${t}\n`;
    }
    appendContent += "\n## Frequently Asked Questions\n\n";
    for (const faq of blocks.faqs) {
      appendContent += `### ${faq.question}\n\n${faq.answer}\n\n`;
    }

    // Append to draft content
    const updatedContent = item.draft_content + appendContent;
    await supabase.from("content_items").update({
      draft_content: updatedContent,
      schema_types: [...new Set([...(item.schema_types || []), "FAQPage"])],
    }).eq("id", contentItemId);

    return new Response(JSON.stringify({
      success: true,
      answer_blocks: blocks,
      appended_length: appendContent.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-answer-blocks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
