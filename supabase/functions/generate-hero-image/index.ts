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

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { keyword, title, contentItemId, brandId, customPrompt, imageType, aspectRatio, style, model } = await req.json();
    if (!keyword && !title) {
      return new Response(JSON.stringify({ error: "keyword or title required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const isBodyImage = imageType === "body";

    // Fetch brand settings for image defaults
    let brand: any = null;
    if (brandId) {
      const { data } = await supabaseAuth.from("brands").select("*").eq("id", brandId).eq("user_id", userId).maybeSingle();
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
    const imgModel = model || "google/gemini-3.1-flash-image-preview";

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

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imgModel,
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI image generation error:", aiRes.status, errText);
      await supabaseAuth.from("agent_runs").update({ status: "error", error_message: `AI error: ${aiRes.status}`, completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: aiRes.status === 429 ? "Rate limited" : aiRes.status === 402 ? "Payment required" : "Image generation failed" }), { status: aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiText = await aiRes.text();
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

    const imageData = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI result:", JSON.stringify(aiResult).substring(0, 500));
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
        brand_id: brandId || brand?.id || null,
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
