import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const channelPrompts: Record<string, string> = {
  linkedin:
    "Convert this article into a compelling LinkedIn post. Start with a strong hook line. Keep under 1300 characters. End with a call-to-action. Add 3-5 relevant hashtags. No markdown formatting.",
  youtube:
    "Create a YouTube video description from this article. Include: an engaging title suggestion on the first line, a detailed description (under 5000 chars), 5 timestamp placeholders, and 10 relevant tags as a comma-separated list.",
  twitter:
    "Convert this article into a Twitter thread. Format as numbered tweets (1/, 2/, etc). Each tweet must be under 280 characters. Start with a compelling hook. End with a CTA tweet. Aim for 5-8 tweets.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentItemId, channel } = await req.json();

    if (!contentItemId || !channel || !channelPrompts[channel]) {
      return new Response(
        JSON.stringify({ error: "Provide contentItemId and channel (linkedin/youtube/twitter)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = { id: claimsData.claims.sub };

    // Fetch content item
    const { data: contentItem, error: ciErr } = await supabase
      .from("content_items")
      .select("title, keyword, draft_content, brand_id")
      .eq("id", contentItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ciErr || !contentItem) {
      return new Response(JSON.stringify({ error: "Content item not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contentItem.draft_content?.trim()) {
      return new Response(JSON.stringify({ error: "Content item has no draft content to repurpose." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert placeholder row
    const { data: row, error: insertErr } = await supabase
      .from("repurposed_content")
      .insert({ user_id: user.id, content_item_id: contentItemId, channel, status: "generating" })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // Fetch brand
    let brand: any = null;
    if (contentItem.brand_id) {
      const { data } = await supabase.from("brands").select("tone_of_voice, writing_style, writing_preferences").eq("id", contentItem.brand_id).eq("user_id", user.id).maybeSingle();
      brand = data;
    }
    if (!brand) {
      const { data } = await supabase.from("brands").select("tone_of_voice, writing_style, writing_preferences").eq("user_id", user.id).eq("is_default", true).maybeSingle();
      brand = data;
    }

    let brandRules = "";
    if (brand) {
      const parts: string[] = [];
      if (brand.tone_of_voice) parts.push(`- Tone: ${brand.tone_of_voice}`);
      if (brand.writing_style) parts.push(`- Style: ${brand.writing_style}`);
      const cliches = (brand.writing_preferences as any)?.avoid_cliches;
      if (Array.isArray(cliches) && cliches.length > 0) {
        parts.push(`- NEVER use these phrases: ${cliches.join(", ")}`);
      }
      if (parts.length > 0) {
        brandRules = `\n\nBrand voice rules:\n${parts.join("\n")}\n`;
      }
    }

    const systemPrompt = `You are a professional content repurposing specialist.${brandRules}\n${channelPrompts[channel]}`;
    const userContent = `Title: ${contentItem.title}\nKeyword: ${contentItem.keyword}\n\nArticle:\n${contentItem.draft_content}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      await supabase.from("repurposed_content").update({ status: "error" }).eq("id", row.id);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", status, await aiResp.text());
      throw new Error("AI gateway error");
    }

    const data = await aiResp.json();
    const output = data.choices?.[0]?.message?.content || "";

    await supabase.from("repurposed_content").update({ output, status: "completed" }).eq("id", row.id);

    return new Response(JSON.stringify({ id: row.id, output, channel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-repurpose error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
