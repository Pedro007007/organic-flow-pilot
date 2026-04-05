import { useState, useEffect } from "react";
import { CheckCircle, TrendingUp, Search, Zap, ArrowRight } from "lucide-react";

const steps = [
  {
    id: 1,
    label: "AI Citation Scan",
    icon: Search,
    title: "Discover where AI mentions you",
    metrics: [
      { label: "ChatGPT", cited: true },
      { label: "Perplexity", cited: true },
      { label: "Gemini", cited: false },
      { label: "AI Overviews", cited: true },
    ],
    score: 78,
  },
  {
    id: 2,
    label: "Content Engine",
    icon: Zap,
    title: "AI writes, optimises & publishes",
    items: [
      { title: "Best CRM for Startups 2025", status: "Published", seo: 94 },
      { title: "How to Automate Lead Scoring", status: "Drafting", seo: 87 },
      { title: "SaaS Pricing Strategy Guide", status: "Queued", seo: null },
    ],
  },
  {
    id: 3,
    label: "Rankings & ROI",
    icon: TrendingUp,
    title: "Track growth in real-time",
    rankings: [
      { kw: "best crm software", pos: 3, change: +12 },
      { kw: "lead scoring tools", pos: 5, change: +8 },
      { kw: "saas pricing guide", pos: 7, change: +15 },
    ],
    traffic: "+142%",
  },
];

export default function ProductWalkthrough() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setActive((a) => (a + 1) % steps.length);
          return 0;
        }
        return p + 1.25;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [active]);

  const step = steps[active];

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-slate-900/30 border border-slate-700/50">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-slate-700/60 rounded-md px-4 py-1 text-[11px] text-slate-400 font-mono">
            app.searchera.io/dashboard
          </div>
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex border-b border-slate-700/50">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setActive(i); setProgress(0); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-all relative ${
              i === active
                ? "text-orange-400 bg-slate-800/50"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{s.label}</span>
            {i === active && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 transition-all" style={{ width: `${progress}%` }} />
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="p-5 min-h-[220px]">
        <p className="text-white/90 text-sm font-bold mb-4">{step.title}</p>

        {active === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {step.metrics!.map((m) => (
                <div key={m.label} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2">
                  <CheckCircle className={`w-4 h-4 ${m.cited ? "text-green-400" : "text-slate-600"}`} />
                  <span className="text-xs text-slate-300 font-medium">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${step.score}%` }} />
              </div>
              <span className="text-orange-400 text-sm font-black">{step.score}/100</span>
            </div>
          </div>
        )}

        {active === 1 && (
          <div className="space-y-2">
            {step.items!.map((item) => (
              <div key={item.title} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{item.title}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${
                    item.status === "Published" ? "text-green-400" : item.status === "Drafting" ? "text-orange-400" : "text-slate-500"
                  }`}>{item.status}</p>
                </div>
                {item.seo && (
                  <div className="ml-2 bg-green-500/10 text-green-400 text-[10px] font-black px-2 py-1 rounded-md">
                    SEO {item.seo}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {active === 2 && (
          <div className="space-y-2">
            {step.rankings!.map((r) => (
              <div key={r.kw} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2.5">
                <span className="text-xs text-white font-medium truncate flex-1">{r.kw}</span>
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-white text-xs font-black">#{r.pos}</span>
                  <span className="text-green-400 text-[10px] font-bold">↑{r.change}</span>
                </div>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl py-3 border border-orange-500/20">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 text-lg font-black">{step.traffic}</span>
              <span className="text-slate-400 text-xs font-bold">organic traffic</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-4">
        <button
          onClick={() => window.location.href = "/contact"}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-xs font-bold py-2.5 rounded-lg transition-all"
        >
          Start Growing Now <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
