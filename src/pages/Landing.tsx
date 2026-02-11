import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, FileText, Bot, BarChart3, ArrowRight, Play, Shield, Zap, TrendingUp, CheckCircle2, Star } from "lucide-react";
import searcheraLogo from "@/assets/searchera-logo.png";

const features = [
  { icon: Search, title: "Keyword Discovery", desc: "Uncover high-impact keywords with AI-driven analysis of your search landscape. Target positions 8–30 for maximum growth." },
  { icon: FileText, title: "Content Pipeline", desc: "Generate, optimize, and publish SEO-ready content at scale with intelligent automation and editorial control." },
  { icon: Bot, title: "Autonomous Agents", desc: "AI agents continuously monitor rankings, discover opportunities, and take action — 24/7 on autopilot." },
  { icon: BarChart3, title: "Performance Analytics", desc: "Track clicks, impressions, and positions with real-time Google Search Console data and actionable insights." },
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

const Landing = () => (
  <div className="min-h-screen flex flex-col bg-white text-gray-900">
    {/* Nav */}
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={searcheraLogo} alt="Searchera" className="h-9 object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
          <a href="#testimonials" className="hover:text-gray-900 transition-colors">Testimonials</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white border-0 shadow-lg shadow-blue-500/25" asChild>
            <Link to="/auth">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </header>

    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(20,184,166,0.06),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-8">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered SEO Automation Platform
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]">
            Dominate Search Results
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 bg-clip-text text-transparent">
              with Intelligent SEO
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 leading-relaxed">
            Discover keywords, generate optimized content, and climb search rankings — all on autopilot. Searchera's AI agents work 24/7 to grow your organic traffic.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white border-0 shadow-xl shadow-blue-500/30 h-12 px-8 text-base" asChild>
              <Link to="/auth">
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-8 text-base" asChild>
              <a href="#demo">
                <Play className="mr-2 h-4 w-4" /> Watch Demo
              </a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">No credit card required · Free to start · Cancel anytime</p>
        </div>
      </section>

      {/* Video Placeholder */}
      <section id="demo" className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 aspect-video shadow-2xl shadow-slate-900/20 border border-slate-700/50">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-colors group">
                <Play className="h-8 w-8 text-white ml-1 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-white/70 text-sm font-medium">See Searchera in Action</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full" />
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
                <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">{s.value}</div>
                <p className="mt-2 text-sm text-gray-600 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Everything You Need to Rank Higher</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">A complete AI-powered toolkit that handles every aspect of your SEO strategy, from keyword research to content creation and performance monitoring.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-200 bg-white p-8 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 mb-5">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How Searchera Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Get started in minutes. Our streamlined process takes you from setup to growth with minimal effort.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="relative">
                <div className="text-5xl font-extrabold text-blue-100 mb-4">{s.num}</div>
                <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Trusted by Growth Teams</h2>
            <p className="mt-4 text-lg text-gray-600">See what our users have to say about Searchera.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-200 bg-white p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
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
            <h3 className="text-xl font-bold text-gray-900">Enterprise-Grade Security</h3>
          </div>
          <p className="text-gray-600 max-w-xl mx-auto">Your data is encrypted at rest and in transit. We follow industry best practices and comply with GDPR. Google Search Console access uses secure OAuth 2.0 authentication.</p>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
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
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to Transform Your SEO?</h2>
          <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">Join thousands of marketers who are growing their organic traffic with Searchera's AI-powered platform.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-xl h-12 px-8 text-base font-semibold" asChild>
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-blue-200">No credit card required</p>
        </div>
      </section>
    </main>

    {/* Footer */}
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={searcheraLogo} alt="Searchera" className="h-8 object-contain" />
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms & Conditions</Link>
            <a href="mailto:support@searchera.io" className="hover:text-gray-900 transition-colors">Contact</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Searchera. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
);

export default Landing;
