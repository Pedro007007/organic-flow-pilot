import { useState, useRef, useEffect } from "react";
import { X, Send, User, Mail, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import danielaAvatar from "@/assets/daniela-avatar.png";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daniela-chat`;

const suggestions = [
  "What is AEO?",
  "How can I rank #1 on Google?",
  "What plan suits my business?",
  "How do AI search engines work?",
];

interface LeadInfo {
  name: string;
  email: string;
  phone: string;
}

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    onError(errData.error || "Something went wrong. Please try again!");
    return;
  }

  if (!resp.body) { onError("No response body"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const json = raw.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

interface DanielaChatProps {
  externalOpen?: boolean;
  onExternalOpenHandled?: () => void;
}

const LeadCaptureForm = ({ onSubmit }: { onSubmit: (lead: LeadInfo) => void }) => {
  const [form, setForm] = useState<LeadInfo>({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error: dbError } = await supabase.from("daniela_leads" as any).insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      } as any);
      if (dbError) throw dbError;
      // Fire-and-forget email notifications
      supabase.functions.invoke("daniela-lead-email", {
        body: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
      }).catch(() => {});
      onSubmit(form);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 bg-gray-50">
      <img src={danielaAvatar} alt="Daniela" className="h-20 w-20 rounded-full object-cover border-2 border-blue-200 mb-4" />
      <h3 className="text-gray-900 font-black text-base mb-1">Hi! I'm Daniela 👋</h3>
      <p className="text-gray-500 text-xs text-center mb-5 max-w-[260px]">
        Before we start, let me know a bit about you so I can give you personalized advice!
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-gray-800"
            maxLength={100}
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-gray-800"
            maxLength={255}
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-gray-800"
            maxLength={30}
          />
        </div>
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        <Button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-blue-700 hover:to-teal-600 text-white font-bold text-sm py-2.5"
        >
          {saving ? "Starting..." : "Start Chatting 🚀"}
        </Button>
      </form>
      <p className="text-[10px] text-gray-400 mt-3 text-center">Your info is safe. We never spam.</p>
    </div>
  );
};

const DanielaChat = ({ externalOpen, onExternalOpenHandled }: DanielaChatProps) => {
  const [open, setOpen] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null);

  useEffect(() => {
    if (externalOpen) {
      setOpen(true);
      onExternalOpenHandled?.();
    }
  }, [externalOpen, onExternalOpenHandled]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    // Prepend user context to the first message so Daniela knows who she's talking to
    const contextualMessages = newMessages.map((m, i) => {
      if (i === 0 && leadInfo) {
        return { ...m, content: `[Context: My name is ${leadInfo.name}, email: ${leadInfo.email}, phone: ${leadInfo.phone}]\n\n${m.content}` };
      }
      return m;
    });

    try {
      await streamChat({
        messages: contextualMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection error. Please try again!" }]);
      setIsLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with Daniela"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400 pl-24 pr-6 py-3 text-white shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-300 hover:scale-105 group ring-1 ring-white/20"
        >
          {/* Avatar — overflows the pill on top-left */}
          <div className="absolute -left-2 -top-10 pointer-events-none">
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-red-500 to-orange-400 opacity-50 blur-xl group-hover:opacity-80 transition-opacity" />
            <img
              src={danielaAvatar}
              alt="Daniela"
              className="relative h-24 w-24 object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
            />
            <span className="absolute bottom-1 right-3 h-3 w-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wide">Meet Daniela</span>
            <span className="text-sm font-black text-white whitespace-nowrap">Your Personal SEO Strategist</span>
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-white border-l border-white/30 pl-4 whitespace-nowrap">
            Chat <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-500 px-4 py-3">
            <div className="relative">
              <img src={danielaAvatar} alt="Daniela" className="h-10 w-10 rounded-full object-cover border-2 border-white/40" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-sm">Daniela</h3>
              <p className="text-blue-100 text-xs font-medium">SEO & AEO Expert • Online</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Lead capture or chat */}
          {!leadInfo ? (
            <LeadCaptureForm onSubmit={setLeadInfo} />
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center pt-4">
                    <div className="flex justify-center mb-3">
                      <img src={danielaAvatar} alt="Daniela" className="h-16 w-16 rounded-full object-cover border-2 border-blue-200" />
                    </div>
                    <p className="text-gray-700 font-bold text-sm mb-1">Hey {leadInfo.name}! 👋</p>
                    <p className="text-gray-500 text-xs mb-4">Great to meet you! Ask me anything about growing your organic traffic!</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="text-xs bg-white border border-blue-200 text-blue-700 rounded-full px-3 py-1.5 hover:bg-blue-50 transition-colors font-semibold"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <img src={danielaAvatar} alt="D" className="h-7 w-7 rounded-full object-cover border border-blue-200 flex-shrink-0 mt-1" />
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-md"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-2 items-start">
                    <img src={danielaAvatar} alt="D" className="h-7 w-7 rounded-full object-cover border border-blue-200 flex-shrink-0 mt-1" />
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 bg-white px-3 py-3">
                <form
                  onSubmit={(e) => { e.preventDefault(); send(input); }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Daniela anything about SEO..."
                    className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="h-10 w-10 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-md flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default DanielaChat;
