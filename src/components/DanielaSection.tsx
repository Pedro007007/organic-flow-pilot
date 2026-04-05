import { Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import danielaAvatar from "@/assets/daniela-avatar.png";

interface DanielaSectionProps {
  onOpenChat: () => void;
}

const DanielaSection = ({ onOpenChat }: DanielaSectionProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(ellipse_at_70%_50%,rgba(20,184,166,0.1),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Avatar */}
          <div className="flex flex-col items-center lg:items-center">
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-red-500 to-orange-400 opacity-30 blur-xl animate-pulse" />
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-500 to-orange-400 opacity-60" />
              <img
                src={danielaAvatar}
                alt="Daniela — AI SEO Expert"
                className="relative h-64 w-64 rounded-full object-cover border-4 border-slate-900"
              />
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-2xl font-black text-white">Daniela</h3>
              <p className="text-orange-400 font-bold text-sm flex items-center justify-center gap-1.5 mt-1">
                <Sparkles className="h-4 w-4" />
                AI SEO & AEO Expert
              </p>
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-1.5 text-sm font-bold text-orange-400 mb-6">
              <MessageCircle className="h-3.5 w-3.5" />
              Free AI Consultation
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white leading-tight">
              Meet <span className="text-red-500 font-black">Daniela</span>,
              <br />Your Personal SEO Strategist
            </h2>
            <p className="mt-4 text-lg text-blue-200/80 leading-relaxed font-medium">
              Get instant, expert-level advice on keyword strategy, content optimization, technical SEO, and Answer Engine Optimization. Daniela knows everything about ranking higher — and she's ready to help you right now.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Deep expertise in SEO, AEO & AI search optimization",
                "Actionable strategies tailored to your business",
                "Available 24/7 — no waiting, no appointments",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-blue-100/90 font-medium">
                  <Sparkles className="h-4 w-4 text-orange-400 flex-shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={onOpenChat}
              size="lg"
              className="mt-8 bg-gradient-to-r from-red-500 to-orange-400 hover:from-red-600 hover:to-orange-500 text-white border-0 shadow-xl shadow-orange-500/20 h-12 px-8 text-base font-black"
            >
              Chat with Daniela <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DanielaSection;
