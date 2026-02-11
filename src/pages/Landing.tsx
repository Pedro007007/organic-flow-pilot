import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Search, FileText, Bot, BarChart3, ArrowRight } from "lucide-react";

const features = [
  { icon: Search, title: "Keyword Discovery", desc: "Uncover high-impact keywords with AI-driven analysis of your search landscape." },
  { icon: FileText, title: "Content Pipeline", desc: "Generate, optimize, and publish SEO-ready content at scale." },
  { icon: Bot, title: "Autonomous Agents", desc: "AI agents continuously monitor rankings, discover opportunities, and take action." },
  { icon: BarChart3, title: "Performance Analytics", desc: "Track clicks, impressions, and positions with real-time Google Search Console data." },
];

const Landing = () => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    {/* Nav */}
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">SEO Engine</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>

    {/* Hero */}
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          AI-Powered <span className="text-gradient">SEO Growth</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Discover keywords, generate optimized content, and climb search rankings — all on autopilot with intelligent agents.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/auth">
              Start Free <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>

    {/* Footer */}
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} SEO Engine. All rights reserved.</span>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  </div>
);

export default Landing;
