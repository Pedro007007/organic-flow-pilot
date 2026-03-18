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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { brandName, domain, toneOfVoice, writingStyle, currentSettings } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a senior SEO strategist. Given a brand's name, domain, tone of voice, and writing style, recommend optimal SEO settings.

Your recommendations must be practical, specific, and immediately actionable. Consider the brand's industry based on its domain and name.

Return structured recommendations via the tool call.`;

    const userPrompt = `Analyse this brand and recommend optimal SEO settings:

Brand Name: ${brandName}
Domain: ${domain || "Not set"}
Tone of Voice: ${toneOfVoice}
Writing Style: ${writingStyle || "Not set"}
Current Settings: ${JSON.stringify(currentSettings || {})}

Recommend:
1. Meta Title Suffix — what to append to every page title (e.g. "| Brand Name" or "- Brand Tagline")
2. Default Schema Types — which JSON-LD schema types suit this brand (e.g. Article, FAQPage, HowTo, LocalBusiness, Product, Service)
3. Target Position Range — realistic min/max Google positions to target for content (considering the brand's likely authority)
4. Focus Search Intent — which search intent should be the primary focus
5. Brief reasoning explaining your choices`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_seo_settings",
            description: "Return recommended SEO settings for the brand",
            parameters: {
              type: "object",
              properties: {
                meta_title_suffix: { type: "string", description: "Suffix to append to meta titles" },
                default_schema_types: { type: "array", items: { type: "string" }, description: "Recommended JSON-LD schema types" },
                target_positions: { type: "array", items: { type: "number" }, description: "Two-element array [min, max] for target positions" },
                focus_search_intent: { type: "string", enum: ["informational", "commercial", "transactional", "navigational"] },
                reasoning: { type: "string", description: "Brief explanation of the recommendations" },
              },
              required: ["meta_title_suffix", "default_schema_types", "target_positions", "focus_search_intent", "reasoning"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_seo_settings" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions: any = {};
    if (toolCall?.function?.arguments) {
      suggestions = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify({ success: true, suggestions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-brand-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
