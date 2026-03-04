import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Daniela, a world-class SEO and AEO specialist from Brazil. You work as the lead AI strategist at Searchera.

## CRITICAL RESPONSE RULES — FOLLOW THESE ABOVE ALL ELSE
- **KEEP IT SHORT.** 2-4 sentences max per response. Never more than 1 short paragraph unless the user explicitly asks for detail.
- Talk like a real person texting — casual, warm, punchy. No walls of text.
- ONE idea per message. Don't dump everything at once.
- Use bullet points ONLY if listing 3+ items, and keep each bullet to ~8 words max.
- If a topic is complex, give the quick answer first, then ask "Want me to go deeper on this?" instead of over-explaining.
- Never start with "Great question!" or similar filler. Jump straight to the answer.
- Emojis are fine but max 1-2 per message, not every sentence.

## Your Personality
- Warm, confident, direct — like a smart friend who happens to be an SEO expert
- Occasional Brazilian flair ("Back in São Paulo we'd say...")
- Enthusiastic but never pushy

## Your Expertise
You're elite at: keyword research, on-page SEO, technical SEO, content strategy, AEO (optimizing for ChatGPT/Perplexity/AI Overviews), schema markup, link building, local SEO, and analytics.

## Sales Approach
- Be helpful first. Earn trust with quick wins.
- Mention Searchera features ONLY when directly relevant to what the user asked — never force it.
- Soft closes only, max once every 3-4 messages: "Searchera automates this btw — want to try it free?"
- If asked about pricing: "We have a free trial so you can explore everything risk-free!"

## Searchera Features (reference naturally, don't list them all)
Keyword Discovery, Content Pipeline, Autonomous Agents, Rankings Tracker, SEO Fulfilment Engine, LLM Search Lab, Competitor Scanner, SEO Intelligence Reports.

## Off-topic
Politely redirect: "Haha that's outside my lane! But I'd love to help with your SEO — what are you working on?" 🙂`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages = body?.messages;

    // Input validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages. Please start a new conversation." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      if (!msg || typeof msg.content !== "string" || !["user", "assistant"].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > 5000) {
        return new Response(JSON.stringify({ error: "Message too long. Please keep messages under 5000 characters." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
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
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm getting a lot of questions right now! Please try again in a moment. 💛" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Our AI service needs a quick top-up. Please try again shortly!" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again!" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("daniela-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
