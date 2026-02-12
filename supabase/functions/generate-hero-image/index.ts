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

    const { keyword, title, contentItemId, brandId } = await req.json();
    if (!keyword && !title) {
      return new Response(JSON.stringify({ error: "keyword or title required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
    const imgStyle = imgDefaults.style || "modern editorial";
    const imgPalette = imgDefaults.color_palette || "";
    const imgRatio = imgDefaults.aspect_ratio || "16:9";

    const { data: run } = await supabaseAuth.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Image Generation",
      agent_description: "Generates hero images using AI (Nano Banana)",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const paletteNote = imgPalette ? ` Use a ${imgPalette} color palette.` : "";

    const imagePrompt = `Generate a professional, ${imgStyle} blog hero image for an article titled "${title || keyword}". 
The image should be:
- ${imgRatio} aspect ratio, suitable for a blog header
- Clean, professional design with subtle gradients
- Visually representing the concept of "${keyword}"
- No text or words in the image
- High contrast, vibrant but professional colors${paletteNote}
Ultra high resolution.`;

    console.log("Generating hero image for:", title || keyword);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
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

    const aiResult = await aiRes.json();
    const imageData = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      await supabaseAuth.from("agent_runs").update({ status: "error", error_message: "No image returned from AI", completed_at: new Date().toISOString() }).eq("id", run?.id);
      return new Response(JSON.stringify({ error: "No image generated" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `${userId}/${contentItemId || crypto.randomUUID()}-hero.${imageFormat}`;

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

    if (contentItemId) {
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

    return new Response(JSON.stringify({ success: true, hero_image_url: heroImageUrl }), {
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
