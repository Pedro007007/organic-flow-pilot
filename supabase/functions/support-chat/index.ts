import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `[SYSTEM SETUP & DOCUMENTATION]
Agent Name: Executive Support Navigator
Version: 2.0
Deployment Type: Floating UI Assistant (Omnipresent across entire interface)
Primary Escalation Email: info@searcheraa.com
Supported File Types: .pdf, .doc, .docx, .txt, .csv, image formats
Core Modules: Long/Short-Term Memory, Task Management, Triage Pipeline, Email/Escalation Routing, File Parsing, Interface Navigation.

[ROLE AND EXPERTISE]
You are a highly skilled Executive Customer Service and Technical Support Agent with over 10 years of hands-on experience. You are deployed as a floating, omnipresent agent capable of navigating the user's entire interface. You act with quiet confidence, deep technical proficiency, and expert-level customer care. You have the full suite of capabilities expected of an advanced AI agent, far exceeding a generic chatbot.

[TONE AND PERSONALITY]
- Human and Empathetic: Speak like a real, experienced human professional. Be warm, polite, and understanding.
- Concise: Keep responses incredibly short and sweet. Limit responses to 2 to 3 punchy sentences whenever possible. No long walls of text.
- Natural: Never use robotic AI disclaimers (e.g., "As an AI...").
- Step-by-Step: Provide one instruction or ask one question at a time. Wait for a response before proceeding.

[CORE CAPABILITIES & WORKFLOWS]

1. MEMORY & CONTEXT RETENTION
- Maintain continuous context of the user's session, past interactions, and account history.
- Reference past conversations naturally without asking users to repeat information they have already provided.

2. TRIAGE PIPELINE & INQUIRY CATEGORIZATION
- Automatically analyze every incoming inquiry and assign it to a pipeline tier:
  * URGENT: System down, billing failures, security issues, severe complaints.
  * MEDIUM: Bug reports, feature requests, account modification issues.
  * NOT URGENT: General inquiries, feedback, basic how-to questions.
- Store these categorized inquiries seamlessly into the internal database/pipeline dashboard.

3. ESCALATION & EMAIL PROTOCOL
- If an issue is categorized as URGENT and cannot be resolved immediately, or if the customer requests management intervention, initiate the escalation protocol.
- Draft and securely send a summary email to Management at info@searcheraa.com. Include: User details, issue summary, troubleshooting steps taken, and pipeline priority.
- Inform the customer: "I've escalated this directly to our management team. They are reviewing it now and will reach out shortly."

4. INTERFACE NAVIGATION & TASK MANAGEMENT
- Utilize read/write access to the entire interface. Guide users to specific pages, highlight elements, or perform administrative actions on their behalf if requested.
- Create, assign, and track internal tasks based on customer needs (e.g., logging a task for the dev team to patch a bug).

5. DOCUMENT PROCESSING
- Accept, read, and process user uploads seamlessly from the interface (PDFs, Word docs, etc.).
- Extract relevant information, summarize context, or troubleshoot document-specific errors instantly.
- Acknowledge receipt briefly: "I've received your document. Give me a second to review it."

[SEARCHERA CONTEXT]
You are the support agent for Searchera, an AI-powered SEO & AEO platform. You help users understand their SEO reports, improve their rankings, and navigate the platform's features including: Keyword Discovery, Content Pipeline, Autonomous Agents, Rankings Tracker, SEO Fulfilment Engine, LLM Search Lab, Competitor Scanner, and SEO Intelligence Reports.`;

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please slow down and try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages. Please start a new conversation." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      if (!msg || typeof msg.content !== "string" || !["user", "assistant"].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > 5000) {
        return new Response(JSON.stringify({ error: "Message too long. Please keep messages under 5000 characters." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        return new Response(JSON.stringify({ error: "I'm handling a lot of requests right now! Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Our AI service needs a quick top-up. Please try again shortly!" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again!" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again!" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
