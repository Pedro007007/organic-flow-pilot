import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, FileText, Bot, BarChart3, ArrowRight, Play, Shield, Zap, TrendingUp, CheckCircle2, Star, Target, Globe, LineChart, Cpu, ChevronRight } from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";

const features = [
  { icon: Search, title: "Keyword Discovery", desc: "Uncover high-impact keywords with AI-driven analysis of your search landscape. Target positions 8–30 for maximum growth." },
  { icon: FileText, title: "Content Pipeline", desc: "Generate, optimize, and publish SEO-ready content at scale with intelligent automation and editorial control." },
  { icon: Bot, title: "Autonomous Agents", desc: "AI agents continuously monitor rankings, discover opportunities, and take action — 24/7 on autopilot." },
  { icon: BarChart3, title: "Performance Analytics", desc: "Track clicks, impressions, and positions with real-time Google Search Console data and actionable insights." },
  { icon: Target, title: "Competitor Analysis", desc: "Scan competitor domains, uncover their keyword strategies, and find gaps you can exploit for faster growth." },
  { icon: Globe, title: "SEO Intelligence Reports", desc: "Generate comprehensive audit reports with revenue projections, technical scores, and shareable client-ready PDFs." },
  { icon: LineChart, title: "Rankings Tracker", desc: "Monitor your Google positions and AI citation appearances across search engines with daily snapshots." },
  { icon: Cpu, title: "SEO Fulfilment Engine", desc: "Automated quality checks ensure every piece of content meets on-page, technical, and schema SEO standards." },
];

const stats = [
  { value: "10x", label: "Faster Content Production" },
  { value: "85%", label: "Time Saved on SEO Tasks" },
  { value: "3x", label: "Organic Traffic Growth" },
  { value: "24/7", label: "Autonomous Monitoring" },
];

const steps = [
  { num: "01", title: "Connect", desc: "Link your Google Search Console in seconds. We import your real performance data automatically." },
  { num: "02", title: "Discover", desc: "Our AI identifies low-hanging fruit keywords and untapped opportunities in your search landscape." },
  { num: "03", title: "Create & Optimize", desc: "Generate SEO-optimized content tailored to your audience, or enhance existing pages for better rankings." },
  { num: "04", title: "Grow", desc: "Monitor results, track progress, and let autonomous agents continuously improve your search presence." },
];

const testimonials = [
  { name: "Sarah Chen", role: "Head of Marketing, TechFlow", quote: "Searchera transformed how we approach SEO. We saw a 3x increase in organic traffic within the first quarter.", stars: 5 },
  { name: "Marcus Rivera", role: "Founder, GrowthLab", quote: "The autonomous agents are a game-changer. It's like having a dedicated SEO team working around the clock.", stars: 5 },
  { name: "Emily Zhao", role: "Content Lead, ScaleUp", quote: "The content pipeline alone saved us 20+ hours per week. The quality is consistently high and SEO-ready.", stars: 5 },
];

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gsc_callback") === "true" && params.get("code")) {
      navigate(`/dashboard?${params.toString()}`, { replace: true });
    }
  }, [navigate]);

  return (
  <div className="min-h-screen flex flex-col bg-white text-gray-900">
    {/* Nav */}
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={searcheraLogo} alt="Searchera" className="h-[100px] object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
          <a href="#testimonials" className="hover:text-gray-900 transition-colors">Testimonials</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 font-bold" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white border-0 shadow-lg shadow-blue-500/25 font-bold" asChild>
            <Link to="/auth">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </header>

    <main className="flex-1">
      {/* Hero + Video Side by Side */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(20,184,166,0.06),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-700 mb-8">
                <Zap className="h-3.5 w-3.5" />
                AI-Powered SEO Automation Platform
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
                Dominate Search Results
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 bg-clip-text text-transparent">
                  with Intelligent SEO
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-gray-600 leading-relaxed font-medium">
                Discover keywords, generate optimized content, and climb search rankings — all on autopilot. Searchera's AI agents work 24/7 to grow your organic traffic.
              </p>
              <div className="mt-10 flex flex-wrap items-start gap-4">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white border-0 shadow-xl shadow-blue-500/30 h-12 px-8 text-base font-bold" asChild>
                  <Link to="/auth">
                    Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-8 text-base font-bold" asChild>
                  <a href="#how-it-works">
                    Learn More
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-gray-500 font-semibold">No credit card required · Free to start · Cancel anytime</p>
            </div>

            {/* Right: Video */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 aspect-video shadow-2xl shadow-slate-900/20 border border-slate-700/50">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-colors group">
                  <Play className="h-8 w-8 text-white ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-white/70 text-sm font-bold">See Searchera in Action</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">{s.value}</div>
                <p className="mt-2 text-sm text-gray-600 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Everything You Need to <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Rank Higher</span></h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto font-medium">A complete AI-powered toolkit that handles every aspect of your SEO strategy, from keyword research to content creation and performance monitoring.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-200 bg-white p-6 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 mb-4">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-base font-black text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Hero gradient theme */}
      <section id="how-it-works" className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(20,184,166,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">How <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Searchera</span> Works</h2>
            <p className="mt-4 text-lg text-blue-200/80 max-w-2xl mx-auto font-medium">Get started in minutes. Our streamlined process takes you from setup to growth with minimal effort.</p>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-center text-center px-6">
                {/* Arrow connector */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-10 -right-4 z-10 items-center">
                    <ChevronRight className="h-8 w-8 text-teal-400/60" strokeWidth={3} />
                  </div>
                )}
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-teal-500/20 border border-blue-500/30 mb-5">
                  <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">{s.num}</span>
                </div>
                <h3 className="text-lg font-black text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-blue-200/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Trusted by <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Growth Teams</span></h2>
            <p className="mt-4 text-lg text-gray-600 font-medium">See what our users have to say about Searchera.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-200 bg-white p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 font-medium">"{t.quote}"</p>
                <div>
                  <p className="font-black text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500 font-semibold">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security / Trust */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-black text-gray-900">Enterprise-Grade Security</h3>
          </div>
          <p className="text-gray-600 max-w-xl mx-auto font-medium">Your data is encrypted at rest and in transit. We follow industry best practices and comply with GDPR. Google Search Console access uses secure OAuth 2.0 authentication.</p>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500 font-bold">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-500" /> SOC 2 Compliant</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-500" /> GDPR Ready</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-500" /> OAuth 2.0 Secured</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-500" /> 256-bit Encryption</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-500 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Ready to Transform Your SEO?</h2>
          <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto font-medium">Join thousands of marketers who are growing their organic traffic with Searchera's AI-powered platform.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-xl h-12 px-8 text-base font-black" asChild>
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-blue-200 font-semibold">No credit card required</p>
        </div>
      </section>
    </main>

    {/* Footer */}
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={searcheraLogo} alt="Searchera" className="h-[90px] object-contain" />
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-bold">
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms & Conditions</Link>
            <a href="mailto:support@searchera.io" className="hover:text-gray-900 transition-colors">Contact</a>
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

export default Landing;
