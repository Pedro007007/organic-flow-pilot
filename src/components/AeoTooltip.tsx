import { useState } from "react";
import { HelpCircle, X, TrendingUp, Bot, MessageSquare } from "lucide-react";

export default function AeoTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
        aria-label="What is AEO?"
      >
        <span className="border-b border-dashed border-orange-400">AEO</span>
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-72 sm:w-80 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-slate-900 rounded-xl border border-slate-700/80 shadow-2xl shadow-black/30 p-4 text-left">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-black text-sm">What is AEO?</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed mb-3">
                <strong className="text-white">Answer Engine Optimization</strong> is the practice of optimizing your content to be cited by AI assistants like ChatGPT, Perplexity, and Google AI Overviews.
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2 bg-slate-800/60 rounded-lg p-2">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-400"><span className="text-white font-semibold">58%</span> of searches will receive AI-generated answers by 2026</p>
                </div>
                <div className="flex items-start gap-2 bg-slate-800/60 rounded-lg p-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-400">Brands cited by AI see <span className="text-white font-semibold">3x more</span> qualified traffic</p>
                </div>
              </div>

              <p className="text-[10px] text-orange-400 font-bold">
                SEO gets you ranked. AEO gets you recommended. You need both.
              </p>

              {/* Arrow */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700/80 rotate-45" />
            </div>
          </div>
        </>
      )}
    </span>
  );
}
