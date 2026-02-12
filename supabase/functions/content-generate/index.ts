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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { contentItemId, outline, keyword, title, serpResearch, strategy, brandId } = await req.json();
    if (!outline && !keyword) {
      return new Response(JSON.stringify({ error: "outline or keyword required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch brand settings if brandId provided
    let brand: any = null;
    if (brandId) {
      const { data } = await supabase.from("brands").select("*").eq("id", brandId).eq("user_id", userId).maybeSingle();
      brand = data;
    }
    if (!brand) {
      // Fallback to default brand
      const { data } = await supabase.from("brands").select("*").eq("user_id", userId).eq("is_default", true).maybeSingle();
      brand = data;
    }

    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Content Generation",
      agent_description: "Writes human-quality, intent-based SEO content with internal links and images",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch existing content for internal linking
    const { data: existingContent } = await supabase
      .from("content_items")
      .select("title, keyword, slug, url")
      .eq("user_id", userId)
      .neq("id", contentItemId || "")
      .not("url", "is", null)
      .limit(20);

    const internalLinks = (existingContent || [])
      .filter((c: any) => c.url || c.slug)
      .map((c: any) => `- [${c.title}](${c.url || `/blog/${c.slug}`}) — about "${c.keyword}"`)
      .join("\n");

    // Build brand-aware system prompt
    const wp = brand?.writing_preferences || {};
    const linkConfig = brand?.internal_linking_config || {};
    const maxLinks = linkConfig.max_links_per_article || 5;
    const anchorStyle = linkConfig.anchor_text_style || "natural";

    const toneInstruction = brand?.tone_of_voice ? `- Tone of voice: ${brand.tone_of_voice}` : "";
    const styleInstruction = brand?.writing_style ? `- Writing style: ${brand.writing_style}` : "";
    const wordCountInstruction = wp.min_word_count || wp.max_word_count
      ? `- Target word count: ${wp.min_word_count || 1500}–${wp.max_word_count || 3500} words`
      : "";
    const clicheInstruction = (wp.avoid_cliches || []).length > 0
      ? `- NEVER use these phrases: ${wp.avoid_cliches.join(", ")}`
      : '- No AI clichés ("In today\'s digital landscape", "Let\'s dive in", etc.)';

    const systemPrompt = `You are a Human-level SEO Copywriter with deep subject understanding.
${brand ? `\nBrand: ${brand.name}${brand.domain ? ` (${brand.domain})` : ""}` : ""}

Style Rules:
- Confident, clear, practical
${toneInstruction}
${styleInstruction}
${clicheInstruction}
- No fluff or filler intros
- Write like a real expert with first-hand experience
${wordCountInstruction}

Must Include:
- Clear answers to user intent
- Semantic keyword usage (natural, not stuffed)
- Scannable formatting with proper headings
- FAQ section with direct answers
- Strong call to action
- TWO image placeholders: place exactly {{IMAGE_1}} and {{IMAGE_2}} on their own lines at natural break points within the article (NOT at the very beginning or end). Place them between sections where a visual would enhance understanding.
${internalLinks ? `- Internal links: naturally weave ${Math.min(maxLinks, 4)} of the following internal links (${anchorStyle} anchor text) into the article body where contextually relevant:\n${internalLinks}` : "- Internal link placeholders: use [Related: Topic Name](/blog/topic-slug) format for suggested internal links"}

Must Avoid:
- Keyword stuffing
- Over-optimisation
- Generic phrasing
- Repetitive sentence patterns
- Placing images at the start or end of the article

Output format: Markdown with proper H1, H2, H3 headings.`;

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
          { role: "user", content: `Write a complete SEO article.\n\nTitle: ${title || keyword}\nKeyword: ${keyword}\nOutline: ${JSON.stringify(outline || "Create your own outline based on the keyword")}${serpResearch ? `\n\nCOMPETITOR INTELLIGENCE:\n- Content gaps to exploit: ${(serpResearch.content_gaps || []).join(", ")}\n- Competitor weaknesses: ${(serpResearch.competitor_weaknesses || []).join(", ")}\n- FAQ questions to answer: ${(serpResearch.faq_questions || []).join(", ")}\n- Unique angles: ${(serpResearch.unique_angles || []).join(", ")}\n- Target word count: ${serpResearch.recommended_word_count || 2500}+\n- Common headings competitors use: ${(serpResearch.common_headings || []).join(", ")}\n\nCRITICAL: Your article MUST cover everything competitors cover PLUS the content gaps. Be more comprehensive, more actionable, and more expert than all competitors.` : ""}${strategy ? `\n\nCONTENT STRATEGY:\n${JSON.stringify(strategy)}` : ""}\n\nIMPORTANT: Include exactly two image placeholders {{IMAGE_1}} and {{IMAGE_2}} placed at natural visual break points within the article body. Write in Markdown format.` },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      await supabase.from("agent_runs").update({ status: "error", error_message: `AI error: ${response.status}`, completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limited" : "AI error" }), { status: response.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";

    // Generate 2 in-body images with brand-aware prompts
    const imgDefaults = brand?.image_defaults || {};
    const imgStyle = imgDefaults.style || "modern editorial";
    const imgPalette = imgDefaults.color_palette || "";
    const paletteNote = imgPalette ? ` Use a ${imgPalette} color palette.` : "";

    const imagePrompts = [
      `Generate a professional, clean blog illustration for an article about "${title || keyword}". The image should visually explain a key concept related to "${keyword}". ${imgStyle} style, no text in the image, 16:9 aspect ratio.${paletteNote} Ultra high resolution.`,
      `Generate a different professional blog illustration for "${title || keyword}". Show a practical example, diagram, or scenario related to "${keyword}". Clean, ${imgStyle} style, no text, 16:9 aspect ratio.${paletteNote} Ultra high resolution.`,
    ];

    const imageUrls: string[] = [];

    for (let i = 0; i < imagePrompts.length; i++) {
      try {
        console.log(`Generating body image ${i + 1} for: ${title || keyword}`);
        const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: imagePrompts[i] }],
            modalities: ["image", "text"],
          }),
        });

        if (!imgRes.ok) {
          console.warn(`Body image ${i + 1} generation failed: ${imgRes.status}`);
          imageUrls.push("");
          continue;
        }

        const imgResult = await imgRes.json();
        const imageData = imgResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          imageUrls.push("");
          continue;
        }

        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          imageUrls.push("");
          continue;
        }

        const imageFormat = base64Match[1];
        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        const fileName = `${userId}/${contentItemId || crypto.randomUUID()}-body-${i + 1}.${imageFormat}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("content-images")
          .upload(fileName, binaryData, {
            contentType: `image/${imageFormat}`,
            upsert: true,
          });

        if (uploadError) {
          console.warn(`Body image ${i + 1} upload failed:`, uploadError.message);
          imageUrls.push("");
          continue;
        }

        const { data: publicUrlData } = supabaseAdmin.storage
          .from("content-images")
          .getPublicUrl(fileName);

        imageUrls.push(publicUrlData.publicUrl);
        console.log(`Body image ${i + 1} uploaded:`, publicUrlData.publicUrl);
      } catch (imgErr) {
        console.warn(`Body image ${i + 1} error:`, imgErr);
        imageUrls.push("");
      }
    }

    // Replace image placeholders with actual markdown images
    if (imageUrls[0]) {
      content = content.replace("{{IMAGE_1}}", `![${keyword} - visual guide](${imageUrls[0]})`);
    } else {
      content = content.replace("{{IMAGE_1}}", "");
    }
    if (imageUrls[1]) {
      content = content.replace("{{IMAGE_2}}", `![${keyword} - practical example](${imageUrls[1]})`);
    } else {
      content = content.replace("{{IMAGE_2}}", "");
    }

    // Update content item if provided
    if (contentItemId) {
      await supabase.from("content_items").update({
        draft_content: content,
        status: "writing",
        brand_id: brandId || brand?.id || null,
      }).eq("id", contentItemId).eq("user_id", userId);
    }

    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: 1,
      completed_at: new Date().toISOString(),
      result: { content_length: content.length, content_item_id: contentItemId, body_images: imageUrls.filter(Boolean).length, brand: brand?.name || null },
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
