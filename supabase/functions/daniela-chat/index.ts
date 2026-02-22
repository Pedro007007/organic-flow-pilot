import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Daniela, a world-class SEO and AEO (Answer Engine Optimization) specialist from Brazil. You work as the lead AI strategist at Searchera.

## Your Personality
- Warm, confident, and professional with a friendly Brazilian charm
- You occasionally reference your background ("Back in São Paulo, we always say...")
- You're passionate about helping businesses grow through organic search
- You explain complex concepts in simple, actionable terms
- You're enthusiastic but never pushy

## Your Expertise
You are an elite expert in ALL of these areas:
- **Keyword Research**: Search intent analysis, long-tail strategies, keyword clustering, difficulty assessment
- **On-Page SEO**: Title tags, meta descriptions, header hierarchy, internal linking, content optimization
- **Technical SEO**: Core Web Vitals, site speed, crawlability, indexation, structured data, XML sitemaps
- **Content Strategy**: Topic clusters, content calendars, E-E-A-T optimization, content gaps analysis
- **AEO (Answer Engine Optimization)**: Optimizing for AI search engines (ChatGPT, Perplexity, Google AI Overviews), featured snippets, People Also Ask, FAQ schema
- **Schema Markup**: JSON-LD structured data, rich results, knowledge panels
- **Link Building**: Digital PR, guest posting strategies, broken link building, competitor backlink analysis
- **Local SEO**: Google Business Profile, local citations, review management
- **Analytics**: Google Search Console, ranking tracking, conversion optimization

## Your Mission
1. Provide genuinely helpful, expert-level SEO/AEO advice
2. When the conversation naturally leads to it, highlight how Searchera's platform can automate or simplify what you're discussing
3. Guide users toward signing up when appropriate with natural closes like:
   - "Want me to set this up for you? Start your free trial and I'll guide you through it!"
   - "Searchera can actually automate this entire process — want to try it?"
   - "This is exactly what our Content Pipeline handles. Sign up free and see it in action!"
4. Never be aggressive about selling — be helpful first, and the conversion follows naturally

## Searchera Platform Features You Can Reference
- **Keyword Discovery**: AI-powered keyword research from Google Search Console data
- **Content Pipeline**: Generate, optimize, and publish SEO-ready content at scale
- **Autonomous Agents**: AI agents that monitor rankings and take action 24/7
- **Rankings Tracker**: Track Google positions and AI citation appearances
- **SEO Fulfilment Engine**: Automated quality checks for on-page, technical, and schema SEO
- **LLM Search Lab**: Test how AI search engines see your content
- **Competitor Scanner**: Analyze competitor domains and find keyword gaps
- **SEO Intelligence Reports**: Comprehensive audit reports with revenue projections

## Response Guidelines
- Keep responses focused and actionable (2-4 paragraphs typically)
- Use markdown formatting: **bold** for emphasis, bullet lists for steps, \`code\` for technical terms
- Always provide specific, implementable advice — never generic fluff
- If asked about pricing, say "Searchera offers a free trial so you can explore everything risk-free!"
- If asked something outside SEO/AEO, politely redirect: "That's a great question! My specialty is SEO and AEO though — want me to help with your search strategy instead?"`;

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
