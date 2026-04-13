import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sectionContent, sectionHeading, articleTopic, targetKeyword, searchIntent, funnelStage, brandId, contentItemId, instructions, mode } = await req.json();

    if (!sectionContent?.trim()) {
      return new Response(
        JSON.stringify({ error: "sectionContent is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user & fetch brand
    const authHeader = req.headers.get("Authorization");
    let brand: any = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabase.auth.getClaims(token);
      const user = claimsData?.claims ? { id: claimsData.claims.sub } : null;
      if (user) {
        if (brandId) {
          const { data } = await supabase.from("brands").select("name, domain, tone_of_voice, writing_style, writing_preferences").eq("id", brandId).eq("user_id", user.id).maybeSingle();
          brand = data;
        }
        if (!brand) {
          const { data } = await supabase.from("brands").select("name, domain, tone_of_voice, writing_style, writing_preferences").eq("user_id", user.id).eq("is_default", true).maybeSingle();
          brand = data;
        }
      }
    }

    // Build brand context
    let brandContext = "No brand provided — default to professional, expert, neutral tone.";
    if (brand) {
      const parts: string[] = [];
      parts.push(`Brand Name: ${brand.name}`);
      if (brand.domain) parts.push(`Website: ${brand.domain}`);
      parts.push(`Brand Voice: ${brand.tone_of_voice || "Professional, authoritative, and practical"}`);
      brandContext = parts.join("\n");
    }

    let toneInstruction = "- Confident, clear, no fluff, no hype";
    if (brand?.tone_of_voice) toneInstruction = `- Tone: ${brand.tone_of_voice}`;

    let styleInstruction = "- Write like a seasoned expert with real-world experience";
    if (brand?.writing_style) styleInstruction = `- Style: ${brand.writing_style}`;

    let clicheInstruction = "- Avoid generic marketing clichés and buzzwords";
    const cliches = (brand?.writing_preferences as any)?.avoid_cliches;
    if (Array.isArray(cliches) && cliches.length > 0) {
      clicheInstruction = `- NEVER use these phrases: ${cliches.join(", ")}`;
    }

    const isSeoFix = mode === "seo-fix" && instructions;

    // For SEO fix mode, count the original words so AI knows the target
    const AI_WINDOW = 16000;
    const contentForAi = sectionContent.substring(0, AI_WINDOW);
    const originalWordCount = contentForAi.split(/\s+/).filter((w: string) => w.length > 0).length;

    const systemPrompt = isSeoFix
      ? `You are an elite SEO content optimizer. You will receive an article and specific SEO improvements to apply.

Your job is to apply the improvements IN-PLACE — modify sentences, add lists, break paragraphs — while keeping ALL existing content intact.

------------------------------
BRAND CONTEXT
------------------------------
${brandContext}

Tone Instructions:
${toneInstruction}

Style Instructions:
${styleInstruction}

${clicheInstruction}

------------------------------
ARTICLE CONTEXT
------------------------------
Article Topic: ${articleTopic || "N/A"}
Target Keyword: ${targetKeyword || "N/A"}

------------------------------
REQUIRED IMPROVEMENTS
------------------------------
${instructions}

------------------------------
ABSOLUTE LENGTH REQUIREMENT
------------------------------
The original article is approximately ${originalWordCount} words.
Your output MUST be at least ${originalWordCount} words. This is NON-NEGOTIABLE.
If improvements require adding bullet lists, transition words, or breaking up paragraphs, this naturally ADDS words — the output should be LONGER, not shorter.

------------------------------
CRITICAL RULES
------------------------------
1. Apply EVERY improvement listed above
2. Keep ALL existing content — do NOT remove sections, headings, links, FAQ, schema, images, or references
3. Keep ALL markdown formatting (headings ##, links [text](url), bold **, lists, images ![alt](url))
4. DO NOT summarize, condense, or paraphrase existing content — keep the original wording where no fix is needed
5. For Readability fixes:
   - Break long sentences (>20 words) into 2 shorter sentences
   - Split large paragraphs into 2-4 sentence paragraphs
   - Add bullet/numbered lists where appropriate (at least 5 list items total)
   - Use transition words between sections
   - But NEVER delete content to improve readability — only restructure it
6. The output must be the COMPLETE article
7. Do NOT add commentary, notes, or explanations
8. Your output MUST be at least ${originalWordCount} words — count carefully

------------------------------
OUTPUT
------------------------------
Return the COMPLETE rewritten article in clean Markdown. Nothing else.`
      : `You are an elite-level SEO + AEO content editor and conversion copywriter.

You are NOT writing from scratch.
You are improving and rewriting a SPECIFIC SECTION of an existing article.

Your job is to rewrite the selected section so it:
- Matches the company's brand voice perfectly
- Improves clarity, authority, and persuasiveness
- Aligns with SEO and Answer Engine Optimisation (AEO)
- Increases conversion intent
- Feels human, expert, and experience-driven

-----------------------------
BRAND CONTEXT
-----------------------------
${brandContext}

Tone Instructions:
${toneInstruction}

Style Instructions:
${styleInstruction}

Cliché Avoidance:
${clicheInstruction}

-----------------------------
SECTION CONTEXT
-----------------------------
Article Topic: ${articleTopic || "N/A"}
Target Keyword: ${targetKeyword || "N/A"}
Search Intent: ${searchIntent || "Informational / Commercial"}
Funnel Stage: ${funnelStage || "Middle of funnel"}

Section Heading:
${sectionHeading || "N/A"}

Original Section Content:
${sectionContent}

-----------------------------
REWRITE OBJECTIVES
-----------------------------
Rewrite this section to:
1. Improve clarity and readability (Grade 6–8 reading level where possible)
2. Strengthen authority and expertise (EEAT)
3. Naturally incorporate semantic keyword variations
4. Answer the user intent directly and clearly
5. Improve flow and structure (short paragraphs, strong rhythm)
6. Add subtle persuasion and conversion triggers
7. Maintain continuity with surrounding article sections
8. Remove fluff, repetition, and generic phrasing
9. Keep it concise but impactful
10. Ensure it sounds like it was written by a human expert — NOT AI

-----------------------------
AEO (ANSWER ENGINE OPTIMISATION)
-----------------------------
Where relevant in this section:
- Add direct, clear answers to likely questions
- Use definition-style sentences when appropriate
- Include structured phrasing that works for featured snippets
- Optimise for voice search and conversational queries

-----------------------------
FORMATTING RULES
-----------------------------
- Keep the original heading unless improvement is necessary
- Use short paragraphs (2–4 lines max)
- Use bullet points ONLY if it improves clarity
- No emojis
- No unnecessary filler intros or outros
- Do NOT add image placeholders
- Do NOT repeat the full article — only rewrite this section

-----------------------------
OUTPUT
-----------------------------
Return ONLY the rewritten section in clean Markdown.
Do NOT explain what you changed.
Do NOT include notes.
Do NOT include commentary.
Only output the improved section.

Consider yourself a senior editor at a top SEO agency and write accordingly.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Retry up to 2 times for SEO fix if content is too short
    const MAX_ATTEMPTS = isSeoFix ? 2 : 1;
    const MIN_RETENTION = 0.88;
    let bestResult = "";
    let bestRatio = 0;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const userMessage = isSeoFix
        ? `Apply the requested improvements to this article. The article is ${originalWordCount} words — your output MUST be at least ${originalWordCount} words:\n\n${contentForAi}`
        : `Rewrite this section:\n\n${sectionContent}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw new Error("AI gateway error");
      }

      const aiData = await response.json();
      const result = aiData.choices?.[0]?.message?.content || "";
      const ratio = result.length / contentForAi.length;

      console.log(`SEO fix attempt ${attempt + 1}: ${contentForAi.length} → ${result.length} chars (${(ratio * 100).toFixed(0)}%)`);

      if (ratio > bestRatio) {
        bestResult = result;
        bestRatio = ratio;
      }

      if (ratio >= MIN_RETENTION) break;

      if (attempt < MAX_ATTEMPTS - 1) {
        console.log("Content too short, retrying with stronger prompt...");
      }
    }

    // In seo-fix mode, save the improved content back to the content item
    if (isSeoFix && contentItemId && bestResult.length > 100) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader! } } }
      );

      // Merge AI rewrite with any content beyond the AI window
      const fullContent = sectionContent;
      const tail = fullContent.length > AI_WINDOW ? fullContent.substring(AI_WINDOW) : "";

      // Extract CTA footer from original content so we can re-append if AI strips it
      const ctaPattern = /\n---\n\n\*Ready to grow your online presence\?.*$/s;
      const ctaMatch = fullContent.match(ctaPattern);
      const originalCta = ctaMatch ? ctaMatch[0] : "";

      // Accept if best attempt is at least 70% (lenient since AI adds structure but condenses prose)
      if (bestRatio >= 0.70) {
        let finalContent = tail ? bestResult + tail : bestResult;

        // Re-append CTA footer if it was in the original but missing from the rewrite
        if (originalCta && !finalContent.includes("Ready to grow your online presence")) {
          finalContent = finalContent.trimEnd() + "\n" + originalCta;
        }

        await supabase.from("content_items").update({ draft_content: finalContent }).eq("id", contentItemId);
        console.log(`SEO fix saved: sent ${contentForAi.length} → got ${bestResult.length} chars (${(bestRatio * 100).toFixed(0)}%), tail ${tail.length}, final ${finalContent.length}`);
      } else {
        console.warn(`SEO fix rejected: best attempt too short (${bestResult.length}/${contentForAi.length} = ${(bestRatio * 100).toFixed(0)}%)`);
        return new Response(JSON.stringify({ result: bestResult, warning: "Content was not saved because it was significantly shorter than the original." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ result: bestResult || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-section-rewrite error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});