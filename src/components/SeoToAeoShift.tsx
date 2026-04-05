import { ArrowRight, Search, Bot, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import serpImg from "@/assets/serp-traditional.jpg";
import aiImg from "@/assets/ai-answer-engine.jpg";

const SeoToAeoShift = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.04),transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-bold text-red-700 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            The Search Landscape Has Changed
          </span>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-gray-900 leading-[1.1]">
            The Shift from SEO
            <br />
            <span className="bg-gradient-to-r from-red-600 via-rose-500 to-red-500 bg-clip-text text-transparent">
              to Answer Engine Optimization
            </span>
          </h2>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto font-semibold leading-relaxed">
            Google isn't the only place people search anymore. ChatGPT, Perplexity, and AI Overviews are answering questions <em>before</em> users ever click a link. If your brand isn't in those answers, you're invisible.
          </p>
        </div>

        {/* Visual comparison: Old vs New */}
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-0 items-stretch mb-20">
          {/* OLD: Traditional SEO */}
          <div className="relative glass-panel p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yesterday</p>
                <h3 className="text-lg font-black text-gray-900">Traditional SEO</h3>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg mb-5">
              <img src={serpImg} alt="Traditional Google search results showing blue links" loading="lazy" width={960} height={720} className="w-full h-auto" />
            </div>

            <ul className="space-y-2.5 text-sm text-gray-500 font-medium">
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" /> Users scan 10 blue links</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" /> Click-through rates declining</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" /> Rankings alone don't guarantee traffic</li>
            </ul>
          </div>

          {/* Arrow connector */}
          <div className="flex items-center justify-center lg:px-6">
            <div className="flex flex-col items-center gap-2">
              <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-500 shadow-lg shadow-red-500/25">
                <ArrowRight className="h-6 w-6 text-white lg:rotate-0 rotate-90" />
              </div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Shift</span>
              <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
            </div>
          </div>

          {/* NEW: AEO */}
          <div className="relative glass-panel border-red-200/40 p-6 lg:p-8">
            <div className="absolute -top-3 right-6 inline-flex items-center rounded-full bg-gradient-to-r from-red-600 to-red-500 px-3 py-1 text-xs font-bold text-white shadow-md">
              THE NEW STANDARD
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Bot className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Today & Tomorrow</p>
                <h3 className="text-lg font-black text-gray-900">AI Answer Engines</h3>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg mb-5">
              <img src={aiImg} alt="AI answer engine citing a brand as a source" loading="lazy" width={960} height={720} className="w-full h-auto" />
            </div>

            <ul className="space-y-2.5 text-sm text-gray-700 font-semibold">
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" /> AI gives one direct answer — <strong>yours</strong></li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" /> 40% of searches now have zero clicks</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" /> Being cited = ultimate brand authority</li>
            </ul>
          </div>
        </div>

        {/* Bridge statement */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="glass-panel p-8 sm:p-10">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">
              Searchera Bridges the Gap
            </h3>
            <p className="text-gray-600 font-medium leading-relaxed mb-6">
              You don't have to choose between Google and AI search. Searchera optimizes your content for <strong>both</strong> — ranking on traditional SERPs while structuring it so ChatGPT, Perplexity, and AI Overviews cite your brand as the authoritative source.
            </p>
            <Button size="lg" className="bg-[length:200%_auto] animate-gradient bg-gradient-to-r from-red-600 via-orange-400 to-red-600 text-white border-0 shadow-xl shadow-red-500/30 h-12 px-8 text-base font-bold hover:opacity-90" asChild>
              <Link to="/auth">
                Start Optimizing for AI Search <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoToAeoShift;
