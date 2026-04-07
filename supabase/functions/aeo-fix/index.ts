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
4. Use the exact format: ## Frequently Asked Questions\n### Question?\nAnswer.`,

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

const AEO_DIMENSIONS = ["faq_coverage", "answer_blocks", "entity_clarity", "schema_richness", "conciseness"] as const;
type AeoDimension = (typeof AEO_DIMENSIONS)[number];

type AeoAnalysis = {
  faq_coverage: number;
  answer_blocks: number;
  entity_clarity: number;
  schema_richness: number;
  conciseness: number;
  recommendations: Array<{
    dimension: string;
    issue: string;
    fix: string;
    priority: "high" | "medium" | "low";
  }>;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeScore = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const stripMarkdownFence = (value: string) =>
  value
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

const toScores = (analysis: AeoAnalysis) => ({
  faq_coverage: normalizeScore(analysis.faq_coverage),
  answer_blocks: normalizeScore(analysis.answer_blocks),
  entity_clarity: normalizeScore(analysis.entity_clarity),
  schema_richness: normalizeScore(analysis.schema_richness),
  conciseness: normalizeScore(analysis.conciseness),
});

const getOverallScore = (scores: ReturnType<typeof toScores>) =>
  Math.round(
    scores.faq_coverage * 0.25 +
      scores.answer_blocks * 0.2 +
      scores.entity_clarity * 0.2 +
      scores.schema_richness * 0.2 +
      scores.conciseness * 0.15,
  );

const getRegressions = (
  before: ReturnType<typeof toScores>,
  after: ReturnType<typeof toScores>,
  targetDimension: AeoDimension,
) => {
  return AEO_DIMENSIONS.flatMap((key) => {
    if (key === targetDimension) return [];

    const beforeScore = before[key];
    const afterScore = after[key];
    const drop = beforeScore - afterScore;
    const crossedHealthyThreshold = beforeScore >= 80 && afterScore < 80;
    const majorDrop = drop >= 8;

    if (!crossedHealthyThreshold && !majorDrop) return [];

    return [{ dimension: key, before: beforeScore, after: afterScore }];
  });
};

async function callLovableChat(apiKey: string, body: Record<string, unknown>) {
  let aiResponse: Response | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (aiResponse.ok) return aiResponse;

    if (aiResponse.status === 429 || aiResponse.status >= 500) {
      await wait(3000 * Math.pow(2, attempt));
      continue;
    }

    if (aiResponse.status === 402) {
      throw new Error("AI credits exhausted");
    }

    throw new Error(`AI gateway error: ${aiResponse.status}`);
  }

  throw new Error(aiResponse ? `AI gateway failed after retries (${aiResponse.status})` : "AI gateway failed after retries");
}

async function analyzeAeoContent(apiKey: string, content: string, schemaTypes: string[]): Promise<AeoAnalysis> {
  const aiResponse = await callLovableChat(apiKey, {
    model: "google/gemini-3-flash-preview",
    messages: [
      {
        role: "system",
        content:
          "You are an AEO (Answer Engine Optimization) expert. Analyze content for AI-readiness — how well it can be extracted and cited by AI search engines like ChatGPT, Perplexity, Gemini, and Copilot. Score each dimension 0-100.",
      },
      {
        role: "user",
        content: `Analyze this content for AEO readiness. Schema types present: ${JSON.stringify(schemaTypes || [])}.\n\nContent:\n${content.slice(0, 8000)}`,
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
              schema_richness: { type: "integer", description: "0-100: Are there schema-friendly structures like FAQPage and HowTo?" },
              conciseness: { type: "integer", description: "0-100: Are answers under 50 words and extractable by AI?" },
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
  });

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("No AEO analysis returned");
  }

  const parsed = JSON.parse(toolCall.function.arguments);

  return {
    faq_coverage: normalizeScore(parsed.faq_coverage),
    answer_blocks: normalizeScore(parsed.answer_blocks),
    entity_clarity: normalizeScore(parsed.entity_clarity),
    schema_richness: normalizeScore(parsed.schema_richness),
    conciseness: normalizeScore(parsed.conciseness),
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { contentItemId, dimension } = await req.json();
    if (!contentItemId || !dimension) {
      return jsonResponse({ error: "contentItemId and dimension required" }, 400);
    }

    if (!AEO_DIMENSIONS.includes(dimension as AeoDimension)) {
      return jsonResponse({ error: `Unknown dimension: ${dimension}` }, 400);
    }

    const typedDimension = dimension as AeoDimension;
    const dimPrompt = dimensionPrompts[typedDimension];

    const { data: item } = await supabase.from("content_items").select("*").eq("id", contentItemId).maybeSingle();
    if (!item) {
      return jsonResponse({ error: "Content item not found" }, 404);
    }

    const content = item.draft_content || "";
    if (!content.trim()) {
      return jsonResponse({ error: "No draft content to improve" }, 400);
    }

    let toneContext = "";
    if (item.brand_id) {
      const { data: brand } = await supabase
        .from("brands")
        .select("tone_of_voice, writing_style")
        .eq("id", item.brand_id)
        .maybeSingle();

      if (brand) {
        toneContext = `\nBrand voice: ${brand.tone_of_voice || "professional"}. Style: ${brand.writing_style || "authoritative"}.`;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const baselineAnalysis = await analyzeAeoContent(LOVABLE_API_KEY, content, item.schema_types || []);
    const baselineScores = toScores(baselineAnalysis);
    const baselineTargetScore = baselineScores[typedDimension];

    const { data: existingScore } = await supabase
      .from("aeo_scores")
      .select("id, scores")
      .eq("content_item_id", contentItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    const storedScores = existingScore?.scores && typeof existingScore.scores === "object"
      ? (existingScore.scores as Record<string, unknown>)
      : null;
    const storedTargetScore = storedScores?.[typedDimension];
    const effectiveTargetScore = storedTargetScore === undefined || storedTargetScore === null
      ? baselineTargetScore
      : normalizeScore(storedTargetScore);

    if (effectiveTargetScore >= 80 && baselineTargetScore >= 80) {
      const baselineOverallScore = getOverallScore(baselineScores);

      if (existingScore) {
        await supabase
          .from("aeo_scores")
          .update({
            overall_score: baselineOverallScore,
            scores: baselineScores,
            recommendations: baselineAnalysis.recommendations,
            created_at: new Date().toISOString(),
          })
          .eq("id", existingScore.id);
      } else {
        await supabase.from("aeo_scores").insert({
          content_item_id: contentItemId,
          user_id: user.id,
          overall_score: baselineOverallScore,
          scores: baselineScores,
          recommendations: baselineAnalysis.recommendations,
        });
      }

      return jsonResponse({
        success: true,
        skipped: true,
        reason: "already_healthy",
        dimension: typedDimension,
        improved: content,
        before: baselineScores,
        after: baselineScores,
        overall_score: baselineOverallScore,
      });
    }

    const systemPrompt = `You are a Senior AEO (Answer Engine Optimization) Specialist. Your job is to rewrite content to score higher on a specific AEO dimension while strictly preserving ALL other AEO optimizations already present.

CRITICAL PRESERVATION RULES — violating any of these is a failure:
1. FAQ COVERAGE: If the article has an FAQ section, keep EVERY existing Q&A pair intact. You may add more, but never remove or weaken existing ones.
2. ANSWER BLOCKS: If a TL;DR, Quick Summary, or Key Takeaways section exists, preserve it exactly unless the target dimension requires a minimal wording tweak.
3. ENTITY CLARITY: Keep all explicit entity definitions, bold terms, glossary entries, dates, versions, and contextual definitions intact.
4. SCHEMA RICHNESS: Keep all schema-friendly structures intact, including FAQ formatting, numbered steps, and all "How to" sections.
5. CONCISENESS: If answers are already short and extractable, do not expand them.

GENERAL RULES:
- Make the SMALLEST possible edit set.
- Only modify the parts of the article directly relevant to the target dimension.
- Return the COMPLETE article with improvements applied.
- Preserve ALL existing markdown links exactly as they are: [text](/path).
- Preserve the heading hierarchy and section order.
- Do NOT add meta-commentary, explanations, or notes about what you changed.
- Write in markdown format.${toneContext}`;

    let approvedContent: string | null = null;
    let approvedAnalysis: AeoAnalysis | null = null;
    let retryFeedback = "";

    for (let attempt = 1; attempt <= 3; attempt++) {
      const rewriteResponse = await callLovableChat(LOVABLE_API_KEY, {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${dimPrompt}

IMPORTANT: Improve only ${typedDimension}. Keep every other AEO strength intact.${retryFeedback ? `

Your previous attempt failed validation for these reasons:
${retryFeedback}

Fix those issues this time.` : ""}

Here is the full article to improve:

${content}`,
          },
        ],
      });

      const rewriteData = await rewriteResponse.json();
      const candidate = stripMarkdownFence(rewriteData.choices?.[0]?.message?.content || "");
      if (!candidate) {
        throw new Error("No improved content returned");
      }

      const candidateAnalysis = await analyzeAeoContent(LOVABLE_API_KEY, candidate, item.schema_types || []);
      const candidateScores = toScores(candidateAnalysis);
      const candidateTargetScore = candidateScores[typedDimension];
      const regressions = getRegressions(baselineScores, candidateScores, typedDimension);
      const targetImproved = candidateTargetScore > baselineTargetScore;

      if (targetImproved && regressions.length === 0) {
        approvedContent = candidate;
        approvedAnalysis = candidateAnalysis;
        break;
      }

      const feedbackLines = [
        !targetImproved
          ? `- ${typedDimension} did not improve enough (${baselineTargetScore} → ${candidateTargetScore}).`
          : null,
        ...regressions.map(
          ({ dimension: regressedDimension, before, after }) =>
            `- ${regressedDimension} regressed (${before} → ${after}). Preserve that structure/content while improving only ${typedDimension}.`,
        ),
      ].filter(Boolean);

      retryFeedback = feedbackLines.join("\n");

      if (attempt === 3) {
        return jsonResponse(
          {
            error: "AI fix was blocked because it improved one AEO metric by hurting others.",
            attempted_dimension: typedDimension,
            before: baselineScores,
          },
          409,
        );
      }
    }

    if (!approvedContent || !approvedAnalysis) {
      return jsonResponse({ error: "Unable to produce a safe AEO fix." }, 409);
    }

    const finalScores = toScores(approvedAnalysis);
    const finalOverallScore = getOverallScore(finalScores);

    await supabase
      .from("content_items")
      .update({ draft_content: approvedContent, updated_at: new Date().toISOString() })
      .eq("id", contentItemId);

    const { data: existingScore } = await supabase
      .from("aeo_scores")
      .select("id")
      .eq("content_item_id", contentItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingScore) {
      await supabase
        .from("aeo_scores")
        .update({
          overall_score: finalOverallScore,
          scores: finalScores,
          recommendations: approvedAnalysis.recommendations,
          created_at: new Date().toISOString(),
        })
        .eq("id", existingScore.id);
    } else {
      await supabase.from("aeo_scores").insert({
        content_item_id: contentItemId,
        user_id: user.id,
        overall_score: finalOverallScore,
        scores: finalScores,
        recommendations: approvedAnalysis.recommendations,
      });
    }

    return jsonResponse({
      success: true,
      dimension: typedDimension,
      improved: approvedContent,
      before: baselineScores,
      after: finalScores,
      overall_score: finalOverallScore,
    });
  } catch (e) {
    console.error("aeo-fix error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});