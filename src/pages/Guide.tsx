import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Rocket,
  Search,
  FileText,
  Bot,
  BarChart3,
  TrendingUp,
  Globe,
  CalendarDays,
  Sparkles,
  ListChecks,
  Tag,
  Users,
  FileBarChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import searcheraLogo from "@/assets/searchera-logo.png";

interface GuideSection {
  id: string;
  step: string;
  title: string;
  icon: React.ElementType;
  color: string;
  summary: string;
  details: string[];
  proTip?: string;
  category: string;
}

const guideSections: GuideSection[] = [
  {
    id: "getting-started", step: "A", title: "Sign Up & First Login", icon: Rocket,
    color: "from-purple-500 to-pink-500", category: "getting-started",
    summary: "Create your account and land on the Performance Overview dashboard.",
    details: [
      "Click 'Get Started' to sign up with your email.",
      "Verify your email and log in — you'll be redirected to the Dashboard.",
      "The Performance Overview shows key metrics: traffic, rankings, content count, and agent activity.",
    ],
    proTip: "Bookmark /dashboard so you always land straight on your control plane.",
  },
  {
    id: "brands", step: "B", title: "Set Up Your Brand", icon: Tag,
    color: "from-violet-500 to-purple-500", category: "getting-started",
    summary: "Configure brand identity so content matches your voice and domain.",
    details: [
      "Navigate to Brands and click 'Add Brand'.",
      "Enter brand name, domain, and tone of voice.",
      "Set writing style preferences — this controls AI content generation.",
      "Configure internal linking rules and mark one brand as 'Default'.",
    ],
    proTip: "A well-defined brand profile dramatically improves AI content quality.",
  },
  {
    id: "keywords", step: "C", title: "Discover Keywords", icon: Search,
    color: "from-amber-500 to-orange-500", category: "content-engine",
    summary: "AI-powered keyword discovery to find high-opportunity search terms.",
    details: [
      "Go to Keywords and enter a seed topic or domain URL.",
      "AI researches search volume, competition, and intent for related terms.",
      "Sort by 'Opportunity' for best traffic-to-difficulty ratio.",
      "Add supporting keywords to build topic clusters.",
    ],
    proTip: "Target keywords in positions 5–20 first — these are your quickest wins.",
  },
  {
    id: "content", step: "D", title: "Content Pipeline", icon: FileText,
    color: "from-emerald-500 to-teal-500", category: "content-engine",
    summary: "Create, generate, and optimize SEO content from draft to published.",
    details: [
      "Click 'New Content' and enter your target keyword.",
      "AI generates a comprehensive article with proper heading structure and internal links.",
      "Content moves through: Discovery → Strategy → Writing → Optimizing → Published → Monitoring.",
      "Click any content item to open the full editor with live preview and SEO score.",
    ],
    proTip: "Use the Optimize tab to hit 90+ SEO score before going live.",
  },
  {
    id: "agents", step: "E", title: "Agent Pipeline", icon: Bot,
    color: "from-blue-500 to-indigo-500", category: "content-engine",
    summary: "Automate the entire workflow with AI agents.",
    details: [
      "Open Agents to see the 7-stage automation pipeline.",
      "Agents run in sequence: Keyword → SERP → Strategy → Content → Image → SEO → Publish.",
      "Click ▶ on any agent to trigger it manually, or schedule via Settings.",
      "Monitor status in real-time: Idle, Running, Done, Error.",
    ],
    proTip: "Run the full pipeline once, then set up auto-scheduling for hands-free growth.",
  },
  {
    id: "calendar", step: "F", title: "Content Calendar", icon: CalendarDays,
    color: "from-cyan-500 to-teal-500", category: "content-engine",
    summary: "Visualize your publishing schedule and ensure consistent output.",
    details: [
      "Calendar view shows all content items plotted by creation/publish date.",
      "Color-coded badges indicate pipeline stage at a glance.",
      "Click any badge to jump into that content piece.",
    ],
    proTip: "Aim for at least 2 published articles per week for consistent SEO momentum.",
  },
  {
    id: "checklist", step: "G", title: "SEO Checklist", icon: ListChecks,
    color: "from-teal-500 to-cyan-500", category: "content-engine",
    summary: "Ensure every piece meets SEO best practices before publishing.",
    details: [
      "Categorized SEO requirements per content item.",
      "Items are auto-verified where possible (meta description, heading structure).",
      "Aim for 100% completion before hitting publish.",
    ],
    proTip: "Never publish content that hasn't passed every checklist item.",
  },
  {
    id: "rankings", step: "H", title: "Track Rankings", icon: TrendingUp,
    color: "from-sky-500 to-blue-500", category: "intelligence",
    summary: "Monitor Google positions and AI engine citations.",
    details: [
      "See every published page tracked with its current Google position.",
      "Click 'Refresh Rankings' to fetch live data.",
      "AI Cited indicates whether ChatGPT or Perplexity reference your content.",
    ],
    proTip: "Check AI Citations weekly — being cited by LLMs is the new organic goldmine.",
  },
  {
    id: "llm-search", step: "I", title: "LLM Search Lab", icon: Sparkles,
    color: "from-rose-500 to-pink-500", category: "intelligence",
    summary: "Test how AI search engines perceive your content.",
    details: [
      "Simulate how AI models respond to queries in your niche.",
      "See which sources the AI cites in its response.",
      "Cross-reference with your content to identify citation gaps.",
    ],
    proTip: "Run searches for your top 10 keywords to check if competitors are cited instead.",
  },
  {
    id: "scanner", step: "J", title: "Competitor Scanner", icon: Globe,
    color: "from-green-500 to-emerald-500", category: "intelligence",
    summary: "Analyze competitor websites to steal their best SEO strategies.",
    details: [
      "Enter a competitor's domain to crawl their site.",
      "Extract keywords, meta patterns, schema types, and content structure.",
      "Results highlight gaps in your strategy vs. competitors.",
    ],
    proTip: "Scan your top 3 competitors for keywords they rank for that you don't target.",
  },
  {
    id: "analytics", step: "K", title: "Analytics", icon: BarChart3,
    color: "from-orange-500 to-amber-500", category: "intelligence",
    summary: "Deep-dive into traffic, engagement, and content performance.",
    details: [
      "Track impressions, clicks, CTR, and average position over time.",
      "Identify which content drives the most traffic.",
      "Use trends to double down on what's working.",
    ],
    proTip: "Filter by date range to compare month-over-month improvements.",
  },
  {
    id: "reports", step: "L", title: "SEO Reports", icon: FileBarChart,
    color: "from-indigo-500 to-violet-500", category: "business",
    summary: "Create branded SEO intelligence reports for clients.",
    details: [
      "Configure report branding (colors, headlines, CTAs).",
      "Includes: Executive Summary, Technical Audit, Keyword Opportunities, and more.",
      "Each report generates a unique shareable link.",
    ],
    proTip: "Use revenue projections to justify SEO investment — numbers talk.",
  },
  {
    id: "leads", step: "M", title: "Capture Leads", icon: Users,
    color: "from-pink-500 to-rose-500", category: "business",
    summary: "Turn SEO reports into a lead generation machine.",
    details: [
      "Visitors enter their email to access full report results.",
      "All captured emails appear in Leads with scan data.",
      "Track when leads viewed their report.",
    ],
    proTip: "Share reports on LinkedIn — the email gate captures warm leads automatically.",
  },
  {
    id: "team", step: "N", title: "Manage Team", icon: Users,
    color: "from-amber-500 to-yellow-500", category: "business",
    summary: "Invite team members and assign roles.",
    details: [
      "Invite collaborators by email.",
      "Assign roles: Admin (full), Operator (create & edit), Viewer (read-only).",
      "Team members inherit your brand settings.",
    ],
    proTip: "Give writers 'Operator' access so they can create but not change brand settings.",
  },
  {
    id: "settings", step: "O", title: "Settings", icon: Settings,
    color: "from-gray-500 to-slate-500", category: "business",
    summary: "Fine-tune webhooks, schedules, and integrations.",
    details: [
      "Connect Google Search Console for real ranking data.",
      "Set up webhook URLs to auto-publish to your CMS.",
      "Configure agent schedules for fully automated production.",
    ],
    proTip: "Webhook + auto-schedule = complete content autopilot.",
  },
];

const categories = [
  { id: "getting-started", label: "Getting Started", color: "from-purple-500 to-pink-500", textColor: "text-purple-400" },
  { id: "content-engine", label: "Content Engine", color: "from-emerald-500 to-teal-500", textColor: "text-emerald-400" },
  { id: "intelligence", label: "Intelligence", color: "from-sky-500 to-blue-500", textColor: "text-sky-400" },
  { id: "business", label: "Business", color: "from-indigo-500 to-violet-500", textColor: "text-indigo-400" },
];

const quickStartSteps = [
  { icon: Tag, label: "Set up your brand", time: "2 min" },
  { icon: Search, label: "Run keyword discovery", time: "1 min" },
  { icon: Bot, label: "Launch agent pipeline", time: "1 min" },
  { icon: TrendingUp, label: "Check first rankings", time: "30 sec" },
];

const Guide = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<GuideSection | null>(null);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(guideSections.map((s) => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  const getSectionsForCategory = (catId: string) => guideSections.filter((s) => s.category === catId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <img src={searcheraLogo} alt="Searchera" className="h-6 w-6 rounded-md" />
          <div>
            <h1 className="text-sm font-bold text-foreground">Searchera Sitemap Guide</h1>
            <p className="text-[10px] text-muted-foreground">Visual map of every feature</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
        {/* Quick Start */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Quick Start</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Go from zero to optimized in under 5 minutes.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickStartSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">{step.label}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {step.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Platform Sitemap</h3>
          <div className="flex gap-2">
            <button onClick={expandAll} className="text-[11px] font-medium text-primary hover:underline">Expand all</button>
            <span className="text-muted-foreground">·</span>
            <button onClick={collapseAll} className="text-[11px] font-medium text-primary hover:underline">Collapse all</button>
          </div>
        </div>

        {/* Root Node */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-card px-5 py-3 shadow-md">
            <img src={searcheraLogo} alt="Searchera" className="h-7 w-7 rounded-md" />
            <span className="text-sm font-bold text-foreground">Searchera</span>
          </div>
          {/* Vertical connector from root */}
          <div className="w-px h-8 bg-border" />
          {/* Horizontal connector bar */}
          <div className="hidden md:block w-full max-w-4xl h-px bg-border relative">
            {/* 4 vertical drops */}
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute top-0 w-px h-6 bg-border"
                style={{ left: `${12.5 + i * 25}%` }}
              />
            ))}
          </div>
          {/* Mobile: single vertical line continues */}
          <div className="md:hidden w-px h-4 bg-border" />
        </div>

        {/* Category Branches */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-3">
          {categories.map((cat) => {
            const sections = getSectionsForCategory(cat.id);
            return (
              <div key={cat.id} className="flex flex-col items-center">
                {/* Category Header */}
                <div className={`w-full rounded-lg bg-gradient-to-r ${cat.color} p-[1px]`}>
                  <div className="rounded-[7px] bg-card px-3 py-2 text-center">
                    <span className={`text-xs font-bold ${cat.textColor}`}>{cat.label}</span>
                  </div>
                </div>

                {/* Vertical connector */}
                <div className="w-px h-3 bg-border" />

                {/* Feature Nodes */}
                <div className="w-full space-y-0">
                  {sections.map((section, idx) => {
                    const Icon = section.icon;
                    const isLast = idx === sections.length - 1;
                    return (
                      <div key={section.id} className="flex flex-col items-center">
                        <button
                          onClick={() => setActiveSection(section)}
                          className="w-full group flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${section.color} text-white text-[10px] font-bold`}>
                            {section.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-semibold text-foreground truncate">{section.title}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{section.summary}</p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                        {!isLast && <div className="w-px h-2 bg-border" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Popup Dialog */}
        <Dialog open={!!activeSection} onOpenChange={(open) => !open && setActiveSection(null)}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            {activeSection && (() => {
              const Icon = activeSection.icon;
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${activeSection.color} text-white text-sm font-bold`}>
                        {activeSection.step}
                      </div>
                      <div>
                        <DialogTitle className="flex items-center gap-2 text-base">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {activeSection.title}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">{activeSection.summary}</p>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <ul className="space-y-3">
                      {activeSection.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    {activeSection.proTip && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 flex items-start gap-2.5">
                        <Target className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        <p className="text-sm text-foreground">
                          <span className="font-semibold text-primary">Pro Tip: </span>
                          {activeSection.proTip}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Footer CTA */}
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h3 className="text-sm font-bold text-foreground mb-1">Ready to grow?</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Start with Step A — you'll be ranking in no time.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Rocket className="h-4 w-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Guide;
