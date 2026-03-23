import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const basePrompts: Record<string, string> = {
  rewrite:
    "Rewrite the following text to be clearer, more engaging, and better structured while preserving the original meaning. IMPORTANT: You MUST preserve ALL existing markdown links (both internal links like [text](/blog/slug) and external links like [text](https://...)). Keep every link intact with its original URL and anchor text. Return only the rewritten text, no commentary.",
  expand:
    "Expand the following text with additional detail, examples, and depth while maintaining the same tone and style. IMPORTANT: You MUST preserve ALL existing markdown links (both internal links like [text](/blog/slug) and external links like [text](https://...)). Keep every link intact with its original URL and anchor text. Do NOT remove or change any links. Return only the expanded text, no commentary.",
  shorten:
    "Condense the following text to be more concise while preserving all key information. Remove filler and redundancy. IMPORTANT: You MUST preserve ALL existing markdown links (both internal links like [text](/blog/slug) and external links like [text](https://...)). Keep every link intact. Return only the shortened text, no commentary.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, action, brandId } = await req.json();

    if (!text || !action || !basePrompts[action]) {
      return new Response(
        JSON.stringify({ error: "Invalid request. Provide text and action (rewrite/expand/shorten)." }),
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

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (brandId) {
          const { data } = await supabase.from("brands").select("tone_of_voice, writing_style, writing_preferences").eq("id", brandId).eq("user_id", user.id).maybeSingle();
          brand = data;
        }
        if (!brand) {
          const { data } = await supabase.from("brands").select("tone_of_voice, writing_style, writing_preferences").eq("user_id", user.id).eq("is_default", true).maybeSingle();
          brand = data;
        }
      }
    }

    // Build brand-aware system prompt
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

    const systemPrompt = `You are a professional content editor.${brandRules}\n${basePrompts[action]}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
          { role: "user", content: text },
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

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-rewrite error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
