import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const dimensionPrompts: Record<string, string> = {
  faq_coverage:
    `Improve FAQ Coverage. The content lacks sufficient Q&A pairs. Your task:
1. Identify the top questions a reader would ask about this topic.
2. Add a well-structured FAQ section (or expand the existing one) with at least 5-8 Q&A pairs.
3. Each answer should be concise (under 50 words), direct, and extractable by AI engines.
4. Use the exact format: ## Frequently Asked Questions\n### Question?\nAnswer.`,

  answer_blocks:
    `Improve Answer Blocks. The content lacks TL;DR summaries and key takeaways. Your task:
1. Add a "TL;DR" or "Quick Summary" block (40-50 words) at the very beginning of the article.
2. Add a "Key Takeaways" section with 4-6 bullet points summarizing the most important insights.
3. Ensure each takeaway is a standalone, extractable statement that AI engines can cite directly.
4. Keep summaries factual and avoid vague language.`,

  entity_clarity:
    `Improve Entity Clarity. Key entities in the content are not explicitly defined. Your task:
1. Identify all important entities (people, organizations, products, concepts, standards, regulations).
2. Add clear, explicit definitions for each entity on first mention using bold text or a glossary.
3. Add context like dates, versions, or status where applicable (e.g., "ECO4, the UK government energy efficiency scheme active since 2023").
4. Ensure AI engines can extract entity definitions without ambiguity.`,

  schema_richness:
    `Improve Schema Richness. The content structure doesn't fully support rich schema markup. Your task:
1. Structure content to naturally support FAQPage, HowTo, and Article schemas.
2. For any step-by-step processes, use clear numbered steps with "How to..." headings.
3. Ensure FAQ sections use consistent Q&A formatting that maps to FAQPage schema.
4. Add structured "How To" sections where instructional content exists.
5. Do NOT add raw JSON-LD — just restructure the prose to be schema-friendly.`,

  conciseness:
    `Improve Conciseness. Answers and key statements are too long for AI extraction. Your task:
1. Shorten all direct answers to under 50 words each.
2. Replace narrative-heavy introductions with a direct, factual opening statement.
3. Break long paragraphs into scannable bullet points or short sentences.
4. Ensure every paragraph's first sentence works as a standalone answer.
5. Remove filler phrases, redundant qualifiers, and hedging language.`,
};

const AEO_DIMENSIONS = [
  "faq_coverage",
  "answer_blocks",
  "entity_clarity",
  "schema_richness",
  "conciseness",
] as const;
type AeoDimension = (typeof AEO_DIMENSIONS)[number];
const HEALTHY_SCORE_THRESHOLD = 80;

type ScoreMap = ReturnType<typeof toScores>;

type CandidateAssessment = {
  content: string;
  analysis: AeoAnalysis;
  scores: ScoreMap;
  targetScore: number;
  targetGain: number;
  overallScore: number;
  regressions: Array<
    { dimension: AeoDimension; before: number; after: number }
  >;
  totalRegression: number;
};

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

const ANALYSIS_WINDOW_CHARS = 16000;
const REWRITE_MAX_TOKENS = 16384;

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

const FAQ_SECTION_PATTERN =
  /(^|\n)##\s+(frequently asked questions|faq|common questions)\b[\s\S]*$/im;
const HOW_TO_SECTION_PATTERN = /(^|\n)##\s+how to\b/im;

function getTopicLabel(title?: string | null, keyword?: string | null) {
  const source = (title || keyword || "this topic")
    .replace(/[|:–—].*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  return source.split(" ").slice(0, 6).join(" ") || "this topic";
}

function normalizeSchemaTypes(
  schemaTypes: string[] | null | undefined,
  extraTypes: string[] = [],
) {
  const normalized = new Set(
    (schemaTypes || []).map((value) => value.trim()).filter(Boolean),
  );

  for (const type of extraTypes) {
    if (type?.trim()) normalized.add(type.trim());
  }

  return Array.from(normalized);
}

function buildSchemaRichnessCandidate(
  content: string,
  title?: string | null,
  keyword?: string | null,
  schemaTypes?: string[] | null,
) {
  const topic = getTopicLabel(title, keyword);
  let updated = content.trim();
  let changed = false;

  if (!HOW_TO_SECTION_PATTERN.test(updated)) {
    const calculatorMode = /calculator|estimate|roi|pricing|cost|savings/i.test(
      `${title || ""} ${keyword || ""}`,
    );
    const howToSection = calculatorMode
      ? `## How to Use This Calculator\n\n1. Gather your current usage, costs, and local assumptions before comparing outcomes.\n2. Enter realistic figures for system size, tariffs, incentives, or operating costs.\n3. Compare best-case, expected, and conservative scenarios before deciding.\n4. Use the FAQ below to validate edge cases, limits, and next steps.`
      : `## How to Apply This Guidance\n\n1. Define the goal, baseline, and constraints for ${topic}.\n2. Collect the main inputs, benchmarks, or assumptions referenced above.\n3. Compare options using the decision criteria already covered in this guide.\n4. Review the FAQ section before acting on the recommendation.`;

    updated = `${updated}\n\n${howToSection}`;
    changed = true;
  }

  if (!FAQ_SECTION_PATTERN.test(updated)) {
    const faqSection = `## Frequently Asked Questions\n\n### What does ${topic} help you evaluate?\n\nIt helps you compare the main inputs, constraints, and likely outcomes so you can make a faster, evidence-based decision.\n\n### Which inputs matter most?\n\nThe biggest drivers are your current baseline, local conditions, costs, expected performance, and timeframe.\n\n### How accurate are the results?\n\nThe result is only as strong as the assumptions you enter, so use current prices, realistic usage, and conservative estimates.\n\n### Should I compare multiple scenarios?\n\nYes. Review best-case, expected, and cautious scenarios to understand risk before making a decision.\n\n### What should I do after using this guide?\n\nValidate the assumptions, confirm any local constraints, and then choose the option with the strongest practical return.`;

    updated = `${updated}\n\n${faqSection}`;
    changed = true;
  }

  return {
    changed,
    content: updated,
    schemaTypes: normalizeSchemaTypes(schemaTypes, ["Article", "FAQPage", "HowTo"]),
  };
}

function splitLongParagraphs(content: string) {
  let changed = 0;
  const updated = content
    .split(/\n\n/)
    .map((block) => {
      const trimmed = block.trim();
      if (
        changed >= 8 ||
        !trimmed ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("!") ||
        trimmed.startsWith("-") ||
        trimmed.startsWith(">") ||
        /^\d+\.\s/m.test(trimmed) ||
        trimmed.length < 320
      ) {
        return block;
      }

      const sentences =
        trimmed.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) || [];

      if (sentences.length < 3) return block;

      let splitIndex = Math.ceil(sentences.length / 2);
      while (splitIndex > 1 && sentences.slice(0, splitIndex).join(" ").length > 260) {
        splitIndex -= 1;
      }

      if (splitIndex <= 0 || splitIndex >= sentences.length) return block;

      changed += 1;
      return `${sentences.slice(0, splitIndex).join(" ")}\n\n${sentences.slice(splitIndex).join(" ")}`;
    })
    .join("\n\n");

  return { changed, content: updated };
}

function buildConcisenessCandidate(
  content: string,
  title?: string | null,
  keyword?: string | null,
) {
  const topic = getTopicLabel(title, keyword);
  let updated = content.trim();
  let changed = false;

  const openingMatch = updated.match(/^(#\s+.+\n\n)([^\n#][\s\S]*?)(\n\n)/);
  if (openingMatch && openingMatch[2].trim().length > 220) {
    const directLead = `${topic} is best evaluated with clear inputs, short answers, and side-by-side assumptions.`;
    updated = `${openingMatch[1]}${directLead}\n\n${openingMatch[2].trim()}${openingMatch[3]}${updated.slice(openingMatch[0].length)}`;
    changed = true;
  }

  const splitResult = splitLongParagraphs(updated);
  if (splitResult.changed > 0) {
    updated = splitResult.content;
    changed = true;
  }

  return { changed, content: updated };
}

function aggressiveConcisenessRewrite(content: string) {
  let updated = content;
  let changed = false;

  // 1. Remove common filler phrases
  const fillerPatterns = [
    /\bIt is worth noting that\b/gi,
    /\bIt('|')s important to note that\b/gi,
    /\bIt should be noted that\b/gi,
    /\bAs mentioned (earlier|above|previously|before)\b,?\s*/gi,
    /\bIn order to\b/gi,
    /\bDue to the fact that\b/gi,
    /\bAt the end of the day\b,?\s*/gi,
    /\bFor the purpose of\b/gi,
    /\bIn terms of\b/gi,
    /\bWith regard to\b/gi,
    /\bIt goes without saying that\b/gi,
    /\bNeedless to say\b,?\s*/gi,
    /\bThe fact of the matter is\b/gi,
    /\bAll things considered\b,?\s*/gi,
    /\bAs a matter of fact\b,?\s*/gi,
    /\bHaving said that\b,?\s*/gi,
    /\bThis is particularly relevant\b/gi,
  ];

  const replacements: Record<string, string> = {
    "in order to": "to",
    "due to the fact that": "because",
    "for the purpose of": "for",
    "with regard to": "regarding",
    "in terms of": "for",
  };

  for (const pattern of fillerPatterns) {
    const before = updated;
    const key = pattern.source.replace(/\\b/g, "").replace(/,\?\\s\*/g, "").toLowerCase();
    const replacement = replacements[key] || "";
    updated = updated.replace(pattern, replacement);
    if (updated !== before) changed = true;
  }

  // 2. Shorten FAQ answers that are too long (over 60 words)
  const faqAnswerPattern = /(###\s+[^\n]+\n\n)([^\n#]+)/g;
  updated = updated.replace(faqAnswerPattern, (_match, question: string, answer: string) => {
    const words = answer.trim().split(/\s+/);
    if (words.length > 60) {
      changed = true;
      return `${question}${words.slice(0, 50).join(" ")}.`;
    }
    return `${question}${answer}`;
  });

  // 3. Compress paragraphs with more than 5 sentences into max 4
  const blocks = updated.split(/\n\n/);
  const compressed = blocks.map((block) => {
    const trimmed = block.trim();
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("!") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith(">") ||
      /^\d+\.\s/m.test(trimmed)
    ) {
      return block;
    }

    const sentences =
      trimmed.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];

    if (sentences.length > 5) {
      changed = true;
      return sentences.slice(0, 4).join(" ");
    }
    return block;
  });
  updated = compressed.join("\n\n");

  // 4. Split remaining long paragraphs
  const splitResult = splitLongParagraphs(updated);
  if (splitResult.changed > 0) {
    updated = splitResult.content;
    changed = true;
  }

  return { changed, content: updated };
}

function getAeoAnalysisWindow(content: string) {
  const normalized = content.trim();
  if (normalized.length <= ANALYSIS_WINDOW_CHARS) return normalized;

  const faqMatch = normalized.match(FAQ_SECTION_PATTERN);
  if (faqMatch?.index !== undefined) {
    const faqStart = faqMatch.index;
    const headBudget = Math.max(
      5000,
      ANALYSIS_WINDOW_CHARS - (normalized.length - faqStart),
    );
    const head = normalized.slice(0, headBudget).trimEnd();
    const faqTail = normalized.slice(faqStart).trimStart();
    const combined = `${head}\n\n${faqTail}`;
    return combined.length <= ANALYSIS_WINDOW_CHARS
      ? combined
      : `${normalized.slice(0, 8000).trimEnd()}\n\n${
        normalized.slice(-8000).trimStart()
      }`;
  }

  return `${normalized.slice(0, 10000).trimEnd()}\n\n${
    normalized.slice(-6000).trimStart()
  }`;
}

function repairAndParseJson(raw: string): unknown {
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) throw new Error("No JSON found in response");
  cleaned = cleaned.substring(jsonStart);

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // Remove trailing commas and control chars
  cleaned = cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x1F\x7F]/g, "");

  try {
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // Repair unbalanced braces/brackets
  let braces = 0, brackets = 0;
  for (const c of cleaned) {
    if (c === "{") braces++;
    if (c === "}") braces--;
    if (c === "[") brackets++;
    if (c === "]") brackets--;
  }
  while (brackets > 0) {
    cleaned += "]";
    brackets--;
  }
  while (braces > 0) {
    cleaned += "}";
    braces--;
  }

  return JSON.parse(cleaned);
}

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

const getTotalRegression = (
  before: ScoreMap,
  after: ScoreMap,
  targetDimension: AeoDimension,
) =>
  AEO_DIMENSIONS.reduce((sum, key) => {
    if (key === targetDimension) return sum;
    return sum + Math.max(0, before[key] - after[key]);
  }, 0);

const isBetterCandidate = (
  candidate: CandidateAssessment,
  best: CandidateAssessment | null,
) => {
  if (!best) return true;
  if (candidate.targetGain !== best.targetGain) {
    return candidate.targetGain > best.targetGain;
  }
  if (candidate.regressions.length !== best.regressions.length) {
    return candidate.regressions.length < best.regressions.length;
  }
  if (candidate.overallScore !== best.overallScore) {
    return candidate.overallScore > best.overallScore;
  }
  return candidate.totalRegression < best.totalRegression;
};

const isAcceptableFallback = (
  candidate: CandidateAssessment,
  baselineOverallScore: number,
) => {
  if (candidate.targetGain <= 0) return false;
  if (candidate.regressions.length === 0) return true;
  if (candidate.overallScore >= baselineOverallScore) return true;

  return (
    candidate.regressions.length <= 2 &&
    candidate.totalRegression <= 10 &&
    candidate.overallScore >= baselineOverallScore - 3
  );
};

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
    const crossedHealthyThreshold = beforeScore >= 80 && afterScore < 75;
    const majorDrop = drop >= 15;

    if (!crossedHealthyThreshold && !majorDrop) return [];

    return [{ dimension: key, before: beforeScore, after: afterScore }];
  });
};

async function callLovableChat(apiKey: string, body: Record<string, unknown>) {
  let aiResponse: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (aiResponse.ok) return aiResponse;

    if (aiResponse.status === 429 || aiResponse.status >= 500) {
      await wait(2000 * Math.pow(2, attempt));
      continue;
    }

    if (aiResponse.status === 402) {
      throw new Error("AI credits exhausted");
    }

    throw new Error(`AI gateway error: ${aiResponse.status}`);
  }

  throw new Error(
    aiResponse
      ? `AI gateway failed after retries (${aiResponse.status})`
      : "AI gateway failed after retries",
  );
}

async function analyzeAeoContent(
  apiKey: string,
  content: string,
  schemaTypes: string[],
): Promise<AeoAnalysis> {
  const analysisWindow = getAeoAnalysisWindow(content);
  const aiResponse = await callLovableChat(apiKey, {
    model: "google/gemini-2.5-flash-lite",
    max_tokens: 2500,
    messages: [
      {
        role: "system",
        content:
          "You are an AEO (Answer Engine Optimization) expert. Analyze content for AI-readiness — how well it can be extracted and cited by AI search engines like ChatGPT, Perplexity, Gemini, and Copilot. Score each dimension 0-100.",
      },
      {
        role: "user",
        content:
          `Analyze this content for AEO readiness. Schema types present: ${
            JSON.stringify(schemaTypes || [])
          }.\n\nContent:\n${analysisWindow}`,
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
              faq_coverage: {
                type: "integer",
                description:
                  "0-100: Does content answer questions in Q+A format?",
              },
              answer_blocks: {
                type: "integer",
                description:
                  "0-100: Are there TL;DR, key takeaways, summaries?",
              },
              entity_clarity: {
                type: "integer",
                description: "0-100: Are key entities explicitly defined?",
              },
              schema_richness: {
                type: "integer",
                description:
                  "0-100: Are there schema-friendly structures like FAQPage and HowTo?",
              },
              conciseness: {
                type: "integer",
                description:
                  "0-100: Are answers under 50 words and extractable by AI?",
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    dimension: { type: "string" },
                    issue: { type: "string" },
                    fix: { type: "string" },
                    priority: {
                      type: "string",
                      enum: ["high", "medium", "low"],
                    },
                  },
                  required: ["dimension", "issue", "fix", "priority"],
                  additionalProperties: false,
                },
              },
            },
            required: [
              "faq_coverage",
              "answer_blocks",
              "entity_clarity",
              "schema_richness",
              "conciseness",
              "recommendations",
            ],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "aeo_analysis" } },
  });

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

  let parsed: Record<string, unknown>;
  if (toolCall?.function?.arguments) {
    parsed = repairAndParseJson(toolCall.function.arguments) as Record<
      string,
      unknown
    >;
  } else {
    // Fallback: try parsing from message content
    const msgContent = aiData.choices?.[0]?.message?.content || "";
    if (!msgContent) throw new Error("No AEO analysis returned");
    parsed = repairAndParseJson(msgContent) as Record<string, unknown>;
  }

  return {
    faq_coverage: normalizeScore(parsed.faq_coverage),
    answer_blocks: normalizeScore(parsed.answer_blocks),
    entity_clarity: normalizeScore(parsed.entity_clarity),
    schema_richness: normalizeScore(parsed.schema_richness),
    conciseness: normalizeScore(parsed.conciseness),
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { contentItemId, dimension } = await req.json();
    if (!contentItemId || !dimension) {
      return jsonResponse(
        { error: "contentItemId and dimension required" },
        400,
      );
    }

    if (!AEO_DIMENSIONS.includes(dimension as AeoDimension)) {
      return jsonResponse({ error: `Unknown dimension: ${dimension}` }, 400);
    }

    const typedDimension = dimension as AeoDimension;
    const dimPrompt = dimensionPrompts[typedDimension];

    const { data: item } = await supabase.from("content_items").select("*").eq(
      "id",
      contentItemId,
    ).maybeSingle();
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
        toneContext = `\nBrand voice: ${
          brand.tone_of_voice || "professional"
        }. Style: ${brand.writing_style || "authoritative"}.`;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { data: existingScore } = await supabase
      .from("aeo_scores")
      .select("id, scores")
      .eq("content_item_id", contentItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    const storedScores =
      existingScore?.scores && typeof existingScore.scores === "object"
        ? (existingScore.scores as Record<string, unknown>)
        : null;

    // Skip expensive fresh analysis if we have stored scores — saves ~15-20s
    let freshAnalysis: AeoAnalysis | null = null;
    let baselineScores: ScoreMap;

    if (storedScores && AEO_DIMENSIONS.every(d => normalizeScore(storedScores[d] ?? 0) > 0)) {
      baselineScores = {
        faq_coverage: normalizeScore(storedScores.faq_coverage ?? 0),
        answer_blocks: normalizeScore(storedScores.answer_blocks ?? 0),
        entity_clarity: normalizeScore(storedScores.entity_clarity ?? 0),
        schema_richness: normalizeScore(storedScores.schema_richness ?? 0),
        conciseness: normalizeScore(storedScores.conciseness ?? 0),
      };
    } else {
      freshAnalysis = await analyzeAeoContent(
        LOVABLE_API_KEY,
        content,
        item.schema_types || [],
      );
      const freshScores = toScores(freshAnalysis);
      baselineScores = {
        faq_coverage: Math.max(freshScores.faq_coverage, normalizeScore(storedScores?.faq_coverage ?? 0)),
        answer_blocks: Math.max(freshScores.answer_blocks, normalizeScore(storedScores?.answer_blocks ?? 0)),
        entity_clarity: Math.max(freshScores.entity_clarity, normalizeScore(storedScores?.entity_clarity ?? 0)),
        schema_richness: Math.max(freshScores.schema_richness, normalizeScore(storedScores?.schema_richness ?? 0)),
        conciseness: Math.max(freshScores.conciseness, normalizeScore(storedScores?.conciseness ?? 0)),
      };
    }

    const baselineTargetScore = baselineScores[typedDimension];
    const baselineOverallScore = getOverallScore(baselineScores);

    if (baselineTargetScore >= HEALTHY_SCORE_THRESHOLD) {
      return jsonResponse({
        success: true,
        skipped: true,
        reason: "already_healthy",
        dimension: typedDimension,
        improved: content,
        before: baselineScores,
        after: baselineScores,
        overall_score: baselineOverallScore,
        recommendations: freshAnalysis?.recommendations || [],
      });
    }

    const baseSchemaTypes = normalizeSchemaTypes(item.schema_types || []);
    const evaluateCandidate = async (
      candidateContent: string,
      candidateSchemaTypes: string[] = baseSchemaTypes,
    ) => {
      const candidateAnalysis = await analyzeAeoContent(
        LOVABLE_API_KEY,
        candidateContent,
        candidateSchemaTypes,
      );
      const candidateScores = toScores(candidateAnalysis);
      const candidateTargetScore = candidateScores[typedDimension];
      const candidateOverallScore = getOverallScore(candidateScores);
      const regressions = getRegressions(
        baselineScores,
        candidateScores,
        typedDimension,
      );

      return {
        analysis: candidateAnalysis,
        assessment: {
          content: candidateContent,
          analysis: candidateAnalysis,
          scores: candidateScores,
          targetScore: candidateTargetScore,
          targetGain: candidateTargetScore - baselineTargetScore,
          overallScore: candidateOverallScore,
          regressions,
          totalRegression: getTotalRegression(
            baselineScores,
            candidateScores,
            typedDimension,
          ),
        } satisfies CandidateAssessment,
      };
    };

    const systemPrompt =
      `You are a Senior AEO (Answer Engine Optimization) Specialist. Your job is to rewrite content to score higher on a specific AEO dimension while strictly preserving ALL other AEO optimizations already present.

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
    let approvedSchemaTypes = baseSchemaTypes;
    let bestCandidate: CandidateAssessment | null = null;
    let retryFeedback = "";

    if (typedDimension === "schema_richness") {
      const deterministic = buildSchemaRichnessCandidate(
        content,
        item.title,
        item.keyword,
        item.schema_types || [],
      );

      if (deterministic.changed) {
        const { analysis, assessment } = await evaluateCandidate(
          deterministic.content,
          deterministic.schemaTypes,
        );

        if (
          assessment.regressions.length === 0 ||
          isAcceptableFallback(assessment, baselineOverallScore)
        ) {
          approvedContent = deterministic.content;
          approvedAnalysis = analysis;
          approvedSchemaTypes = deterministic.schemaTypes;
        } else if (assessment.targetGain > 0 && isBetterCandidate(assessment, bestCandidate)) {
          bestCandidate = assessment;
        }
      }
    }

    if (typedDimension === "conciseness" && !approvedContent) {
      const deterministic = aggressiveConcisenessRewrite(
        content,
      );

      if (deterministic.changed) {
        const { analysis, assessment } = await evaluateCandidate(
          deterministic.content,
          baseSchemaTypes,
        );

        if (
          assessment.regressions.length === 0 ||
          isAcceptableFallback(assessment, baselineOverallScore)
        ) {
          approvedContent = deterministic.content;
          approvedAnalysis = analysis;
        } else if (assessment.targetGain > 0) {
          // For conciseness (15% weight), accept even with minor regressions
          if (assessment.totalRegression <= 15 && assessment.overallScore >= baselineOverallScore - 5) {
            approvedContent = deterministic.content;
            approvedAnalysis = analysis;
          } else if (isBetterCandidate(assessment, bestCandidate)) {
            bestCandidate = assessment;
          }
        }
      }
    }

    // Single attempt to stay within 150s timeout
    if (!approvedContent || !approvedAnalysis) {
      const rewriteResponse = await callLovableChat(LOVABLE_API_KEY, {
        model: "google/gemini-2.5-flash",
        max_tokens: REWRITE_MAX_TOKENS,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${dimPrompt}

IMPORTANT: Improve only ${typedDimension}. Keep every other AEO strength intact.

Here is the full article to improve:

${content.length > 14000 ? content.slice(0, 14000) : content}`,
          },
        ],
      });

      const rewriteData = await rewriteResponse.json();
      const candidate = stripMarkdownFence(
        rewriteData.choices?.[0]?.message?.content || "",
      );
      if (!candidate) {
        throw new Error("No improved content returned");
      }

      const { analysis: candidateAnalysis, assessment: candidateAssessment } = await evaluateCandidate(
        candidate,
        baseSchemaTypes,
      );
      const targetImproved = candidateAssessment.targetGain > 0;

      if (targetImproved) {
        bestCandidate = candidateAssessment;

        if (candidateAssessment.regressions.length === 0) {
          approvedContent = candidate;
          approvedAnalysis = candidateAnalysis;
        }
      } else if (
        typedDimension === "conciseness" &&
        candidateAssessment.targetScore >= baselineTargetScore &&
        candidateAssessment.regressions.length === 0
      ) {
        // For conciseness: accept even lateral moves if no regressions
        // (the AI likely shortened prose even if the score didn't budge)
        approvedContent = candidate;
        approvedAnalysis = candidateAnalysis;
      }
    }

    if (!approvedContent || !approvedAnalysis) {
      if (
        bestCandidate &&
        (isAcceptableFallback(bestCandidate, baselineOverallScore) ||
          (typedDimension === "conciseness" &&
            bestCandidate.targetGain > 0 &&
            bestCandidate.totalRegression <= 15 &&
            bestCandidate.overallScore >= baselineOverallScore - 5))
      ) {
        approvedContent = bestCandidate.content;
        approvedAnalysis = bestCandidate.analysis;
      }
    }

    if (!approvedContent || !approvedAnalysis) {
      return jsonResponse({
        success: false,
        skipped: true,
        reason: "no_safe_improvement",
        message:
          "No safe AEO rewrite was found without reducing other strong metrics.",
        dimension: typedDimension,
        improved: content,
        before: baselineScores,
        after: baselineScores,
        overall_score: baselineOverallScore,
        recommendations: freshAnalysis?.recommendations || [],
      });
    }

    const rawFinalScores = toScores(approvedAnalysis);
    const finalScores: ScoreMap = {
      faq_coverage: Math.max(
        rawFinalScores.faq_coverage,
        baselineScores.faq_coverage,
      ),
      answer_blocks: Math.max(
        rawFinalScores.answer_blocks,
        baselineScores.answer_blocks,
      ),
      entity_clarity: Math.max(
        rawFinalScores.entity_clarity,
        baselineScores.entity_clarity,
      ),
      schema_richness: Math.max(
        rawFinalScores.schema_richness,
        baselineScores.schema_richness,
      ),
      conciseness: Math.max(
        rawFinalScores.conciseness,
        baselineScores.conciseness,
      ),
    };
    const finalOverallScore = getOverallScore(finalScores);
    const contentUpdateTimestamp = new Date().toISOString();

    await supabase
      .from("content_items")
      .update({
        draft_content: approvedContent,
        schema_types: approvedSchemaTypes,
        seo_score: finalOverallScore,
        updated_at: contentUpdateTimestamp,
      })
      .eq("id", contentItemId);

    const { data: existingScoreFinal } = await supabase
      .from("aeo_scores")
      .select("id")
      .eq("content_item_id", contentItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingScoreFinal) {
      await supabase
        .from("aeo_scores")
        .update({
          overall_score: finalOverallScore,
          scores: finalScores,
          recommendations: approvedAnalysis.recommendations,
          created_at: contentUpdateTimestamp,
        })
        .eq("id", existingScoreFinal.id);
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
      recommendations: approvedAnalysis.recommendations,
    });
  } catch (e) {
    console.error("aeo-fix error:", e);
    return jsonResponse({
      error: e instanceof Error ? e.message : "Unknown error",
    }, 500);
  }
});
