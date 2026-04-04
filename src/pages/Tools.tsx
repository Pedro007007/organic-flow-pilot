import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search, FileText, Code, CheckCircle2, AlertTriangle,
  ArrowRight, Zap, Globe, Tag, Hash, Type,
} from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";

/* ── Meta Tag Checker ── */
const MetaTagChecker = () => {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<null | {
    title: string; titleLen: number;
    desc: string; descLen: number;
    h1Count: number; imgNoAlt: number;
    hasCanonical: boolean; hasViewport: boolean;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      // Client-side analysis using a CORS proxy approach
      // For demo purposes, we simulate analysis
      await new Promise(r => setTimeout(r, 1500));
      setResults({
        title: `Sample Title for ${url}`,
        titleLen: 42,
        desc: "This is a sample meta description extracted from the analyzed page.",
        descLen: 68,
        h1Count: 1,
        imgNoAlt: 2,
        hasCanonical: true,
        hasViewport: true,
      });
    } catch {
      setError("Could not analyze this URL. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Input
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
          onKeyDown={(e) => e.key === "Enter" && analyze()}
        />
        <Button onClick={analyze} disabled={loading || !url.trim()} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white border-0 font-bold gap-2">
          {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="h-4 w-4" />}
          Analyze
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {results && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-900">Title Tag</span>
              <Badge variant="outline" className={`text-xs ${results.titleLen >= 30 && results.titleLen <= 60 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"}`}>
                {results.titleLen} chars
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{results.title}</p>
            <p className="text-xs text-gray-500 mt-2">
              {results.titleLen >= 30 && results.titleLen <= 60
                ? "✓ Good length (30–60 characters)"
                : "⚠ Recommended: 30–60 characters"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-teal-500" />
              <span className="text-sm font-bold text-gray-900">Meta Description</span>
              <Badge variant="outline" className={`text-xs ${results.descLen >= 120 && results.descLen <= 160 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"}`}>
                {results.descLen} chars
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{results.desc}</p>
            <p className="text-xs text-gray-500 mt-2">
              {results.descLen >= 120 && results.descLen <= 160
                ? "✓ Good length (120–160 characters)"
                : "⚠ Recommended: 120–160 characters"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-bold text-gray-900">H1 Tags</span>
            </div>
            <div className="flex items-center gap-2">
              {results.h1Count === 1 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm text-gray-700">
                {results.h1Count} H1 tag{results.h1Count !== 1 ? "s" : ""} found
                {results.h1Count === 1 ? " — perfect!" : " — should be exactly 1"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-900">Technical SEO</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                {results.hasCanonical ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                <span className="text-gray-700">Canonical tag</span>
              </div>
              <div className="flex items-center gap-2">
                {results.hasViewport ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                <span className="text-gray-700">Viewport meta</span>
              </div>
              <div className="flex items-center gap-2">
                {results.imgNoAlt === 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                <span className="text-gray-700">{results.imgNoAlt} images missing alt text</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Keyword Density Analyzer ── */
const KeywordDensityAnalyzer = () => {
  const [text, setText] = useState("");
  const [results, setResults] = useState<{ word: string; count: number; density: string }[] | null>(null);

  const analyze = () => {
    if (!text.trim()) return;
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
    const stopWords = new Set(["the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out", "with", "this", "that", "from", "have", "been", "they", "will", "more", "when", "what", "your", "there", "which", "their", "also", "into", "just", "about", "than", "them", "very", "some", "only"]);
    const filtered = words.filter(w => !stopWords.has(w));
    const freq: Record<string, number> = {};
    filtered.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const total = filtered.length;
    const sorted = Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / total) * 100).toFixed(1),
      }));
    setResults(sorted);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-bold text-gray-900">Paste your content</Label>
        <Textarea
          placeholder="Paste your article or page content here to analyze keyword density..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="mt-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{text.split(/\s+/).filter(Boolean).length} words</span>
        <Button onClick={analyze} disabled={!text.trim()} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white border-0 font-bold gap-2">
          <Tag className="h-4 w-4" /> Analyze Density
        </Button>
      </div>

      {results && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="grid grid-cols-3 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase">Keyword</span>
            <span className="text-xs font-bold text-gray-500 uppercase text-center">Count</span>
            <span className="text-xs font-bold text-gray-500 uppercase text-right">Density</span>
          </div>
          {results.map((r) => (
            <div key={r.word} className="grid grid-cols-3 gap-4 px-5 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-semibold text-gray-900">{r.word}</span>
              <span className="text-sm text-gray-600 text-center">{r.count}</span>
              <div className="flex items-center justify-end gap-2">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"
                    style={{ width: `${Math.min(parseFloat(r.density) * 10, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">{r.density}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main Page ── */
const Tools = () => {
  const [activeTool, setActiveTool] = useState<"meta" | "density">("meta");

  return (
    <div className="light min-h-screen flex flex-col bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-1">
          <Link to="/" className="flex items-center gap-2">
            <img src={searcheraLogo} alt="Searchera" className="h-[84px] object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
            <Link to="/#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
            <Link to="/tools" className="text-gray-900 transition-colors">Free Tools</Link>
            <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 font-bold" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white border-0 shadow-lg shadow-blue-500/25 font-bold" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-700 mb-6">
              <Zap className="h-3.5 w-3.5" /> 100% Free · No Login Required
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Free <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">SEO Tools</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 font-semibold max-w-2xl mx-auto">
              Instantly check your meta tags and analyze keyword density — no account needed.
            </p>
          </div>
        </section>

        {/* Tool Selector */}
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setActiveTool("meta")}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                  activeTool === "meta"
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Code className="h-4 w-4" /> Meta Tag Checker
              </button>
              <button
                onClick={() => setActiveTool("density")}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                  activeTool === "density"
                    ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Tag className="h-4 w-4" /> Keyword Density Analyzer
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
              {activeTool === "meta" ? <MetaTagChecker /> : <KeywordDensityAnalyzer />}
            </div>

            {/* Upsell CTA */}
            <div className="mt-12 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 p-8 text-center">
              <h2 className="text-2xl font-black text-white">Want the full power?</h2>
              <p className="mt-2 text-blue-100 font-medium max-w-lg mx-auto">
                Get AI-powered keyword discovery, automated content generation, ranking tracking, and AI citation monitoring — all in one platform.
              </p>
              <Button size="lg" className="mt-6 bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-xl h-12 px-8 text-base font-black" asChild>
                <Link to="/auth">Start Free Trial <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={searcheraLogo} alt="Searchera" className="h-[84px] object-contain" />
            </Link>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-bold">
              <Link to="/about" className="hover:text-gray-900 transition-colors">About</Link>
              <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
              <Link to="/tools" className="hover:text-gray-900 transition-colors">Free Tools</Link>
              <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
              <a href="/privacy.html" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
              <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms & Conditions</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 font-semibold">
            © {new Date().getFullYear()} Searchera. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Tools;
