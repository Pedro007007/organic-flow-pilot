import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const dimensionPrompts: Record<string, string> = {
  faq_coverage: `Improve FAQ Coverage. The content lacks sufficient Q&A pairs. Your task:
1. Identify the top questions a reader would ask about this topic.
2. Add a well-structured FAQ section (or expand the existing one) with at least 5-8 Q&A pairs.
3. Each answer should be concise (under 50 words), direct, and extractable by AI engines.
4. Use the exact format: ## Frequently Asked Questions\\n### Question?\\nAnswer.`,

  answer_blocks: `Improve Answer Blocks. The content lacks TL;DR summaries and key takeaways. Your task:
1. Add a "TL;DR" or "Quick Summary" block (40-50 words) at the very beginning of the article.
2. Add a "Key Takeaways" section with 4-6 bullet points summarizing the most important insights.
3. Ensure each takeaway is a standalone, extractable statement that AI engines can cite directly.
4. Keep summaries factual and avoid vague language.`,

  entity_clarity: `Improve Entity Clarity. Key entities in the content are not explicitly defined. Your task:
1. Identify all important entities (people, organizations, products, concepts, standards, regulations).
2. Add clear, explicit definitions for each entity on first mention using bold text or a glossary.
3. Add context like dates, versions, or status where applicable (e.g., "ECO4, the UK government energy efficiency scheme active since 2023").
4. Ensure AI engines can extract entity definitions without ambiguity.`,

  schema_richness: `Improve Schema Richness. The content structure doesn't fully support rich schema markup. Your task:
1. Structure content to naturally support FAQPage, HowTo, and Article schemas.
2. For any step-by-step processes, use clear numbered steps with "How to..." headings.
3. Ensure FAQ sections use consistent Q&A formatting that maps to FAQPage schema.
4. Add structured "How To" sections where instructional content exists.
5. Do NOT add raw JSON-LD — just restructure the prose to be schema-friendly.`,

  conciseness: `Improve Conciseness. Answers and key statements are too long for AI extraction. Your task:
1. Shorten all direct answers to under 50 words each.
2. Replace narrative-heavy introductions with a direct, factual opening statement.
3. Break long paragraphs into scannable bullet points or short sentences.
4. Ensure every paragraph's first sentence works as a standalone answer.
5. Remove filler phrases, redundant qualifiers, and hedging language.`,
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

    const { contentItemId, dimension } = await req.json();
    if (!contentItemId || !dimension) {
      return new Response(JSON.stringify({ error: "contentItemId and dimension required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const dimPrompt = dimensionPrompts[dimension];
    if (!dimPrompt) {
      return new Response(JSON.stringify({ error: `Unknown dimension: ${dimension}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      return new Response(JSON.stringify({ error: "No draft content to improve" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch brand for tone context
    let toneContext = "";
    if (item.brand_id) {
      const { data: brand } = await supabase.from("brands").select("tone_of_voice, writing_style").eq("id", item.brand_id).maybeSingle();
      if (brand) {
        toneContext = `\nBrand voice: ${brand.tone_of_voice || "professional"}. Style: ${brand.writing_style || "authoritative"}.`;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a Senior AEO (Answer Engine Optimization) Specialist. Your job is to rewrite content to score higher on a specific AEO dimension while strictly preserving ALL other AEO optimizations already present.

CRITICAL PRESERVATION RULES — violating any of these is a failure:
1. FAQ COVERAGE: If the article has an FAQ section, keep EVERY existing Q&A pair intact (you may add more, never remove or shorten existing ones).
2. ANSWER BLOCKS: If a TL;DR, Quick Summary, or Key Takeaways section exists, preserve it exactly. Do not remove or merge it.
3. ENTITY CLARITY: If entities are explicitly defined (bold terms, glossary entries, contextual definitions), keep ALL of them word-for-word.
4. SCHEMA RICHNESS: If the article has "How to" steps, FAQ formatting, or structured sections that support schema markup, preserve that structure exactly.
5. CONCISENESS: If answers/paragraphs are already concise (~50 words or fewer), do NOT expand them.

GENERAL RULES:
- Return the COMPLETE article with improvements applied — not just the changed sections.
- Preserve ALL existing markdown links exactly as they are: [text](/path).
- Preserve the overall heading hierarchy and structure.
- Do NOT add meta-commentary, explanations, or notes about what you changed.
- Only modify the parts of the article directly relevant to the dimension you are improving.
- Write in markdown format.${toneContext}`;

    // Retry with exponential backoff
    let aiResponse: Response | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${dimPrompt}\n\nHere is the full article to improve:\n\n${content}` },
          ],
        }),
      });

      if (aiResponse.ok) break;
      if (aiResponse.status === 429 || aiResponse.status >= 500) {
        await new Promise(r => setTimeout(r, 3000 * Math.pow(2, attempt)));
        continue;
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    if (!aiResponse || !aiResponse.ok) throw new Error("AI gateway failed after retries");

    const aiData = await aiResponse.json();
    const improved = aiData.choices?.[0]?.message?.content;
    if (!improved) throw new Error("No improved content returned");

    // Update the draft content
    await supabase
      .from("content_items")
      .update({ draft_content: improved, updated_at: new Date().toISOString() })
      .eq("id", contentItemId);

    return new Response(JSON.stringify({ success: true, dimension, improved }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("aeo-fix error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
