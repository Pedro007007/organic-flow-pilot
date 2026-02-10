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

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const { contentItemId, outline, keyword, title } = await req.json();
    if (!outline && !keyword) {
      return new Response(JSON.stringify({ error: "outline or keyword required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Content Generation",
      agent_description: "Writes human-quality, intent-based SEO content",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a Human-level SEO Copywriter with deep subject understanding.

Style Rules:
- Confident, clear, practical
- No AI clichés ("In today's digital landscape", "Let's dive in", etc.)
- No fluff or filler intros
- Write like a real expert with first-hand experience

Must Include:
- Clear answers to user intent
- Semantic keyword usage (natural, not stuffed)
- Scannable formatting with proper headings
- FAQ section with direct answers
- Strong call to action
- Internal link placeholders

Must Avoid:
- Keyword stuffing
- Over-optimisation
- Generic phrasing
- Repetitive sentence patterns

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
          { role: "user", content: `Write a complete SEO article.\n\nTitle: ${title || keyword}\nKeyword: ${keyword}\nOutline: ${JSON.stringify(outline || "Create your own outline based on the keyword")}\n\nWrite in Markdown format.` },
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
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Update content item if provided
    if (contentItemId) {
      await supabase.from("content_items").update({
        draft_content: content,
        status: "writing",
      }).eq("id", contentItemId).eq("user_id", userId);
    }

    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: 1,
      completed_at: new Date().toISOString(),
      result: { content_length: content.length, content_item_id: contentItemId },
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
