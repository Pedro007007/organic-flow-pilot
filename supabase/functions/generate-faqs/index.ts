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

    const { contentItemId, faqCount = 7 } = await req.json();
    if (!contentItemId) {
      return new Response(JSON.stringify({ error: "contentItemId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const clampedCount = Math.min(Math.max(Number(faqCount) || 7, 3), 20);

    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentItemId)
      .eq("user_id", user.id)
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
            content: `You are a Senior SEO & AEO Content Strategist. Generate FAQ pairs that are highly relevant, insightful, and optimised for AI answer engine extraction. Each answer should be concise (under 60 words), authoritative, and directly address the question. Questions should reflect real user search intent and long-tail queries related to the article topic. Do NOT repeat information already covered in existing FAQs in the article.`,
          },
          {
            role: "user",
            content: `Generate exactly ${clampedCount} new FAQ question-answer pairs for this article. Make them unique and cover different aspects of the topic:\n\n${item.draft_content.slice(0, 10000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_faqs",
              description: "Return FAQ question-answer pairs",
              parameters: {
                type: "object",
                properties: {
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
                    description: `${clampedCount} FAQ question-answer pairs`,
                  },
                },
                required: ["faqs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_faqs" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded — try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No FAQs returned");

    const { faqs } = JSON.parse(toolCall.function.arguments);

    // Build markdown FAQ section
    let faqMarkdown = "\n\n## Frequently Asked Questions\n\n";
    for (const faq of faqs) {
      faqMarkdown += `### ${faq.question}\n\n${faq.answer}\n\n`;
    }

    // Check if there's already a FAQ section — if so, append under it; otherwise append at end
    const faqHeaderRegex = /\n## Frequently Asked Questions\s*\n/i;
    let updatedContent: string;

    if (faqHeaderRegex.test(item.draft_content)) {
      // Append new FAQs at the end of the existing content (they'll be after existing FAQs)
      let appendFaqs = "\n";
      for (const faq of faqs) {
        appendFaqs += `### ${faq.question}\n\n${faq.answer}\n\n`;
      }
      updatedContent = item.draft_content.trimEnd() + "\n" + appendFaqs;
    } else {
      updatedContent = item.draft_content.trimEnd() + faqMarkdown;
    }

    await supabase.from("content_items").update({
      draft_content: updatedContent,
      schema_types: [...new Set([...(item.schema_types || []), "FAQPage"])],
    }).eq("id", contentItemId).eq("user_id", user.id);

    return new Response(JSON.stringify({
      success: true,
      faqs,
      count: faqs.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-faqs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
