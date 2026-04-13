import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const RETRYABLE_AI_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Ordered fallback chain for image models
const IMAGE_MODEL_FALLBACKS: Record<string, string[]> = {
  "google/gemini-3.1-flash-image-preview": ["google/gemini-3-pro-image-preview", "google/gemini-2.5-flash-image"],
  "google/gemini-3-pro-image-preview": ["google/gemini-3.1-flash-image-preview", "google/gemini-2.5-flash-image"],
  "google/gemini-2.5-flash-image": ["google/gemini-3.1-flash-image-preview", "google/gemini-3-pro-image-preview"],
};

async function callAiImageWithRetries({
  apiKey,
  model,
  prompt,
  maxAttempts = 3,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  maxAttempts?: number;
}) {
  const modelsToTry = [model, ...(IMAGE_MODEL_FALLBACKS[model] || [])];

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const response = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
          max_tokens: 8192,
        }),
      });

      const responseText = await response.text();

      if (response.ok) {
        // Treat empty body as retryable
        if (!responseText || responseText.trim().length === 0) {
          console.warn(`AI returned empty body (${currentModel}), attempt ${attempt}/${maxAttempts}`);
          if (attempt === maxAttempts) {
            console.warn(`Model ${currentModel} returned empty responses, trying next model...`);
            break;
          }
          await sleep(3000 * 2 ** (attempt - 1));
          continue;
        }
        return { ok: true as const, status: response.status, body: responseText };
      }

      console.error(`AI image generation error (${currentModel}):`, response.status, responseText.substring(0, 300));

      const isRetryable = RETRYABLE_AI_STATUS_CODES.has(response.status);
      if (!isRetryable) {
        return { ok: false as const, status: response.status, body: responseText };
      }

      if (attempt === maxAttempts) {
        console.warn(`Model ${currentModel} exhausted ${maxAttempts} attempts, trying next model...`);
        break; // try next model in fallback chain
      }

      const retryAfterSeconds = Number(response.headers.get("retry-after"));
      const backoffMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 3000 * 2 ** (attempt - 1);

      console.warn(`AI image generation rate limited, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
      await sleep(backoffMs);
    }
  }

  return { ok: false as const, status: 429, body: "All image models rate limited" };
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

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = data.claims.sub;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { keyword, title, contentItemId, brandId, customPrompt, imageType, aspectRatio, style, model } = await req.json();
    if (!keyword && !title) {
      return new Response(JSON.stringify({ error: "keyword or title required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const isBodyImage = imageType === "body";

    // Fetch brand settings for image defaults
    let brand: any = null;
    let resolvedBrandId = brandId || null;

    if (!resolvedBrandId && contentItemId) {
      const { data: item } = await supabaseAuth
        .from("content_items")
        .select("brand_id")
        .eq("id", contentItemId)
        .eq("user_id", userId)
        .maybeSingle();
      if (item?.brand_id) resolvedBrandId = item.brand_id;
    }

    if (resolvedBrandId) {
      const { data } = await supabaseAuth.from("brands").select("*").eq("id", resolvedBrandId).eq("user_id", userId).maybeSingle();
      brand = data;
    }
    if (!brand) {
      const { data } = await supabaseAuth.from("brands").select("*").eq("user_id", userId).eq("is_default", true).maybeSingle();
      brand = data;
    }

    const imgDefaults = brand?.image_defaults || {};
    const imgStyle = style || imgDefaults.style || "modern editorial";
    const imgPalette = imgDefaults.color_palette || "";
    const imgRatio = aspectRatio || imgDefaults.aspect_ratio || "16:9";
    // Only these models support image output modalities
    const IMAGE_CAPABLE_MODELS = [
      "google/gemini-3-pro-image-preview",
      "google/gemini-3.1-flash-image-preview",
      "google/gemini-2.5-flash-image",
    ];
    const DEFAULT_IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";
    const requestedModel = model || DEFAULT_IMAGE_MODEL;
    const imgModel = IMAGE_CAPABLE_MODELS.includes(requestedModel) ? requestedModel : DEFAULT_IMAGE_MODEL;

    const { data: run } = await supabaseAuth.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Image Generation",
      agent_description: "Generates hero images using AI (Nano Banana)",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const paletteNote = imgPalette ? `\nPrimary Brand Colour(s): ${imgPalette}` : "\nPrimary Brand Colour(s): dark blue, electric purple, white";

    // Map aspect ratios to approximate pixel dimensions for better AI compliance
    const ratioDimensions: Record<string, string> = {
      "16:9": "1920x1080 pixels (wide landscape)",
      "4:3": "1600x1200 pixels (standard landscape)",
      "4:2": "1600x800 pixels (ultra-wide banner)",
      "3:2": "1800x1200 pixels (photo landscape)",
      "1:1": "1200x1200 pixels (perfect square)",
      "4:5": "1080x1350 pixels (tall portrait)",
      "9:16": "1080x1920 pixels (vertical/mobile)",
    };
    const dimensionHint = ratioDimensions[imgRatio] || `${imgRatio} ratio`;

    // Style-specific visual directions
    const styleDirections: Record<string, { lighting: string; texture: string; subject: string; mood: string; background: string }> = {
      "modern editorial": {
        lighting: "Cinematic lighting or soft gradient lighting",
        texture: "Clean surfaces, subtle gradients, layered transparencies",
        subject: "Abstract conceptual scene or professional digital workspace",
        mood: "Premium, sophisticated, high contrast",
        background: "Dark gradient or soft light tech background",
      },
      "cinematic": {
        lighting: "Dramatic cinematic lighting with deep shadows and golden/cool highlights, volumetric light rays",
        texture: "Film grain, anamorphic lens flare, shallow depth of field with bokeh",
        subject: "A dramatic scene with strong narrative tension, as if captured from a blockbuster film",
        mood: "Epic, dramatic, emotionally charged, moody atmosphere",
        background: "Rich atmospheric environment with fog, haze, or dramatic sky",
      },
      "photorealistic": {
        lighting: "Natural daylight or studio photography lighting, realistic light falloff and reflections",
        texture: "True-to-life materials and surfaces, visible micro-details, realistic skin/fabric/metal textures",
        subject: "A real-world scene or object photographed with a professional DSLR camera, 85mm lens, f/1.8",
        mood: "Authentic, tangible, believable — indistinguishable from a real photograph",
        background: "Real-world environment with natural depth of field blur",
      },
      "ultrarealistic": {
        lighting: "Hyper-realistic global illumination, subsurface scattering on organic materials, physically accurate caustics",
        texture: "Extreme micro-detail: pores, fiber weave, dust particles, water droplets, fingerprints on glass",
        subject: "An ultra-detailed real-world scene rendered at 8K resolution, macro-level detail visible everywhere",
        mood: "Jaw-droppingly lifelike, almost tactile — viewers should question if it is a photo or render",
        background: "Photographic environment with tilt-shift bokeh and atmospheric haze",
      },
      "flat illustration": {
        lighting: "Flat, even lighting with no dramatic shadows — clean and uniform",
        texture: "Smooth flat colors, geometric shapes, vector-style edges, no gradients or textures",
        subject: "Simplified conceptual illustration using iconic shapes and symbols",
        mood: "Friendly, approachable, clear, modern startup aesthetic",
        background: "Solid color or simple two-tone flat background",
      },
      "3d render": {
        lighting: "Studio three-point lighting with soft ambient occlusion and global illumination",
        texture: "Glossy/matte 3D materials, smooth plastic or glass surfaces, subsurface scattering",
        subject: "A stylized 3D scene with clean geometry, floating elements, and isometric or perspective composition",
        mood: "Playful yet professional, modern tech product aesthetic",
        background: "Clean gradient or abstract 3D environment with soft reflections",
      },
      "watercolor": {
        lighting: "Soft diffused natural light, as if painted en plein air",
        texture: "Visible brush strokes, wet-on-wet paint bleeding, paper grain texture, organic color mixing",
        subject: "An artistic, hand-painted interpretation of the concept with flowing organic forms",
        mood: "Artistic, organic, warm, handcrafted elegance",
        background: "Textured watercolor paper with soft color washes and paint splatter edges",
      },
      "minimalist": {
        lighting: "Clean, even, high-key lighting with minimal shadows",
        texture: "Ultra-smooth surfaces, generous whitespace, single accent color pops",
        subject: "One single iconic element or symbol centered with maximum negative space",
        mood: "Calm, refined, intentional — every element earns its place",
        background: "Pure white, off-white, or single muted tone",
      },
      "abstract": {
        lighting: "Ethereal glowing light sources, neon accents, bioluminescent effects",
        texture: "Fluid forms, particle systems, fractal patterns, organic data visualizations",
        subject: "Non-representational composition of flowing shapes, energy fields, and dynamic color interactions",
        mood: "Futuristic, imaginative, visually striking, thought-provoking",
        background: "Deep dark canvas with vibrant color explosions or flowing gradients",
      },
    };

    const dir = styleDirections[imgStyle] || styleDirections["modern editorial"];

    const imagePrompt = `You are a senior brand visual director and conversion-focused creative strategist.
Your task is to generate a HIGH-IMPACT hero image for a landing page or article.
This image must NOT be generic. It must visually communicate authority, positioning, and value instantly.

CRITICAL IMAGE DIMENSIONS — YOU MUST FOLLOW THIS EXACTLY:
- Aspect ratio: ${imgRatio}
- Target dimensions: ${dimensionHint}
- The output image MUST be exactly ${imgRatio} aspect ratio. This is non-negotiable.
- If the ratio is 16:9, the image must be significantly wider than it is tall.
- If the ratio is 1:1, the image must be a perfect square.
- If the ratio is 9:16, the image must be significantly taller than it is wide.
- If the ratio is 4:5, the image must be slightly taller than it is wide (portrait).

BRAND CONTEXT
${brand ? `Brand Name: ${brand.name}${brand.domain ? `\nWebsite: ${brand.domain}` : ""}` : "Default brand tone: modern, professional, tech-forward"}

PAGE CONTEXT
Article / Page Title: ${title || keyword}
Primary Keyword: ${keyword}

VISUAL STYLE DIRECTION — "${imgStyle.toUpperCase()}"
THIS IS THE MOST IMPORTANT SECTION. You MUST faithfully produce a "${imgStyle}" style image. Do NOT default to generic tech/SaaS imagery.

Art Direction:
- Overall mood: ${dir.mood}
- Lighting: ${dir.lighting}
- Texture & Surface: ${dir.texture}
- Subject matter: ${dir.subject}
- Depth and layered composition (foreground / midground / background)

COMPOSITION RULES
- The canvas MUST be ${imgRatio} (${dimensionHint})
- Leave NEGATIVE SPACE on one side for text overlay
- Main focal point slightly off-center (rule of thirds)
- Strong visual hierarchy (clear subject + supporting environment)
- No clutter, no stock-photo look
- NO text or words in the image

COLOUR & BRAND IDENTITY${paletteNote}
Background Style: ${dir.background}
The image MUST match the brand palette while staying true to the "${imgStyle}" visual style.

SUBJECT DIRECTION
${dir.subject}
Ultra high resolution, ${dimensionHint}.${customPrompt ? `\n\nCLIENT CREATIVE DIRECTION\n${customPrompt}\nIncorporate the above direction into the visual concept while maintaining brand consistency and the "${imgStyle}" style.` : ""}`;

    console.log("Generating hero image for:", title || keyword);

    const aiResponse = await callAiImageWithRetries({
      apiKey: LOVABLE_API_KEY,
      model: imgModel,
      prompt: imagePrompt,
      maxAttempts: 5,
    });

    if (!aiResponse.ok) {
      const isRateLimited = aiResponse.status === 429;
      const isCreditsError = aiResponse.status === 402;

      await supabaseAuth
        .from("agent_runs")
        .update({
          status: "error",
          error_message: `AI error: ${aiResponse.status}`,
          completed_at: new Date().toISOString(),
          result: isRateLimited ? { queued: true, reason: "rate_limited" } : null,
        })
        .eq("id", run?.id);

      // Graceful handling for provider throttling: avoid surfacing hard runtime errors in the UI
      if (isRateLimited) {
        let existingImageUrl: string | null = null;
        if (contentItemId) {
          const { data: existingItem } = await supabaseAuth
            .from("content_items")
            .select("hero_image_url")
            .eq("id", contentItemId)
            .eq("user_id", userId)
            .maybeSingle();
          existingImageUrl = existingItem?.hero_image_url || null;
        }

        return new Response(
          JSON.stringify({
            success: false,
            queued: true,
            error: "Rate limited",
            message: "Image provider is temporarily rate-limited. Please retry in about 60 seconds.",
            hero_image_url: existingImageUrl,
            image_url: existingImageUrl,
          }),
          {
            status: 202,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": "60",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({ error: isCreditsError ? "Payment required" : "Image generation failed" }),
        {
          status: isCreditsError ? 402 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiText = aiResponse.body;
    if (!aiText || aiText.trim().length === 0) {
      console.error("AI gateway returned empty response body");
      await supabaseAuth.from("agent_runs").update({ status: "error", error_message: "AI returned empty response", completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: "AI returned empty response — please retry" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let aiResult: any;
    try {
      aiResult = JSON.parse(aiText);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", aiText.substring(0, 500));
      await supabaseAuth.from("agent_runs").update({ status: "error", error_message: "Invalid AI response", completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: "AI returned invalid response — please retry" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let imageData = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // If the primary attempt returned text but no image, retry once with a different model
    if (!imageData) {
      const textReply = aiResult.choices?.[0]?.message?.content || "";
      console.warn("No image in AI result. Model reply:", textReply.substring(0, 200));
      console.warn("Retrying with fallback model google/gemini-3-pro-image-preview...");

      const retryResponse = await callAiImageWithRetries({
        apiKey: LOVABLE_API_KEY,
        model: "google/gemini-3-pro-image-preview",
        prompt: imagePrompt,
        maxAttempts: 3,
      });

      if (retryResponse.ok) {
        try {
          const retryResult = JSON.parse(retryResponse.body);
          imageData = retryResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        } catch { /* will fall through to error */ }
      }
    }

    if (!imageData) {
      console.error("No image after all retries");
      await supabaseAuth.from("agent_runs").update({ status: "error", error_message: "No image returned from AI", completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: "No image generated — please retry" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const imageSuffix = isBodyImage ? `body-${Date.now()}` : "hero";
    const fileName = `${userId}/${contentItemId || crypto.randomUUID()}-${imageSuffix}.${imageFormat}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("content-images")
      .upload(fileName, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("content-images")
      .getPublicUrl(fileName);

    const heroImageUrl = publicUrlData.publicUrl;
    console.log("Hero image uploaded:", heroImageUrl);

    if (contentItemId && !isBodyImage) {
      await supabaseAuth.from("content_items").update({
        hero_image_url: heroImageUrl,
      }).eq("id", contentItemId).eq("user_id", userId);
    }

    await supabaseAuth.from("agent_runs").update({
      status: "completed",
      items_processed: 1,
      completed_at: new Date().toISOString(),
      result: { hero_image_url: heroImageUrl, content_item_id: contentItemId, brand: brand?.name || null },
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, hero_image_url: heroImageUrl, image_url: heroImageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-hero-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
