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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
}

const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    step: "A",
    title: "Sign Up & First Login",
    icon: Rocket,
    color: "from-purple-500 to-pink-500",
    summary: "Create your account, log in, and land on the Performance Overview dashboard.",
    details: [
      "Head to the landing page and click 'Get Started Free' to sign up with your email.",
      "Verify your email and log in — you'll be redirected to the Dashboard.",
      "The Performance Overview shows your key metrics at a glance: traffic, rankings, content count, and agent activity.",
      "If you're brand new, the welcome card will guide you to your first actions.",
    ],
    proTip: "Bookmark /dashboard so you always land straight on your control plane.",
  },
  {
    id: "brands",
    step: "B",
    title: "Set Up Your Brand",
    icon: Tag,
    color: "from-violet-500 to-purple-500",
    summary: "Configure your brand identity so every piece of content matches your voice and domain.",
    details: [
      "Navigate to Brands in the sidebar and click 'Add Brand'.",
      "Enter your brand name, domain, and tone of voice (e.g. professional, casual, authoritative).",
      "Set your writing style preferences — this controls how AI generates all future content.",
      "Configure internal linking rules so articles auto-link to your existing pages.",
      "Mark one brand as 'Default' so new content automatically inherits its settings.",
    ],
    proTip: "A well-defined brand profile dramatically improves AI content quality — spend time here first.",
  },
  {
    id: "keywords",
    step: "C",
    title: "Discover Keywords",
    icon: Search,
    color: "from-amber-500 to-orange-500",
    summary: "Use AI-powered keyword discovery to find high-opportunity search terms for your niche.",
    details: [
      "Go to Keywords and enter a seed topic or your domain URL.",
      "The AI agent researches search volume, competition, and intent for related terms.",
      "Each keyword is tagged with Search Intent (informational, transactional, etc.) and Content Type suggestion.",
      "Sort by 'Opportunity' to focus on keywords with the best traffic-to-difficulty ratio.",
      "Add supporting keywords to build topic clusters that dominate SERPs.",
    ],
    proTip: "Target keywords where you're in positions 5–20 first — these are your quickest wins.",
  },
  {
    id: "content",
    step: "D",
    title: "Build Your Content Pipeline",
    icon: FileText,
    color: "from-emerald-500 to-teal-500",
    summary: "Create, generate, and optimize SEO content that ranks — from first draft to published article.",
    details: [
      "Navigate to Content and click 'New Content' to start a new article.",
      "Enter your target keyword — the system performs SERP research to identify competitor gaps.",
      "AI generates a comprehensive, expert-level article with proper heading structure and internal links.",
      "Each piece includes a hero image, meta description, and structured data (schema markup).",
      "Content moves through stages: Discovery → Strategy → Writing → Optimizing → Published → Monitoring.",
      "Click any content item to open the full editor with live preview and SEO score.",
    ],
    proTip: "Don't just publish — use the Optimize tab to hit 90+ SEO score before going live.",
  },
  {
    id: "agents",
    step: "E",
    title: "Run the Agent Pipeline",
    icon: Bot,
    color: "from-blue-500 to-indigo-500",
    summary: "Automate the entire workflow — from keyword research to publishing — with AI agents.",
    details: [
      "Open Agents to see the 7-stage automation pipeline.",
      "Agents run in sequence: Keyword Discovery → SERP Research → Content Strategy → Content Generation → Image Generation → SEO Optimization → Publishing.",
      "Click the ▶ play icon on any agent to trigger it manually.",
      "Monitor status in real-time: Idle (waiting), Running (processing), Done (complete), Error (failed).",
      "Agents can be scheduled to run automatically via Settings → Agent Schedule.",
    ],
    proTip: "Run the full pipeline once to see it in action, then set up auto-scheduling for hands-free growth.",
  },
  {
    id: "rankings",
    step: "F",
    title: "Track Rankings & AI Citations",
    icon: TrendingUp,
    color: "from-sky-500 to-blue-500",
    summary: "Monitor your Google positions and whether AI engines like ChatGPT cite your content.",
    details: [
      "Go to Rankings to see every published page tracked with its current Google position.",
      "Click 'Refresh Rankings' to fetch live data for all tracked URLs.",
      "The Change column shows position movement (green = up, red = down).",
      "AI Cited indicates whether engines like ChatGPT or Perplexity reference your content in answers.",
      "Switch to Chart View for visual trend lines over time.",
    ],
    proTip: "Check AI Citations weekly — being cited by LLMs is the new organic traffic goldmine.",
  },
  {
    id: "llm-search",
    step: "G",
    title: "LLM Search Lab",
    icon: Sparkles,
    color: "from-rose-500 to-pink-500",
    summary: "Test how AI search engines perceive and reference your content.",
    details: [
      "Navigate to LLM Search to simulate how AI models respond to queries in your niche.",
      "Enter a search prompt and see which sources the AI cites in its response.",
      "Cross-reference with your own content to identify citation gaps.",
      "Use insights to optimize your content for AI answer inclusion.",
    ],
    proTip: "Run searches for your top 10 keywords to see if competitors are being cited instead of you.",
  },
  {
    id: "calendar",
    step: "H",
    title: "Plan with Content Calendar",
    icon: CalendarDays,
    color: "from-cyan-500 to-teal-500",
    summary: "Visualize your publishing schedule and ensure consistent output.",
    details: [
      "The Calendar view shows all content items plotted by their creation/publish date.",
      "Color-coded badges indicate pipeline stage at a glance.",
      "Click any badge to jump directly into that content piece.",
      "Use month navigation to plan weeks ahead and identify publishing gaps.",
    ],
    proTip: "Aim for at least 2 published articles per week for consistent SEO momentum.",
  },
  {
    id: "scanner",
    step: "I",
    title: "Scan Competitors",
    icon: Globe,
    color: "from-green-500 to-emerald-500",
    summary: "Analyze competitor websites to steal their best SEO strategies.",
    details: [
      "Open Scanner and enter a competitor's domain.",
      "The AI crawls their site and extracts: keywords, meta patterns, schema types, and content structure.",
      "Results highlight gaps in your own strategy vs. what's working for competitors.",
      "Use findings to inform keyword discovery and content creation.",
    ],
    proTip: "Scan your top 3 competitors and look for keywords they rank for that you don't target yet.",
  },
  {
    id: "reports",
    step: "J",
    title: "Generate SEO Reports",
    icon: FileBarChart,
    color: "from-indigo-500 to-violet-500",
    summary: "Create branded SEO intelligence reports to share with clients or stakeholders.",
    details: [
      "Go to Reports to configure your report branding (colors, headlines, CTAs).",
      "Reports include: Executive Summary, Technical Audit, Keyword Opportunities, Competitor Gap Analysis, Content Authority, Backlink Profile, Revenue Projection, and Action Plan.",
      "Each report generates a unique shareable link for client access.",
      "Customize which sections to show/hide and add disclaimer text.",
    ],
    proTip: "Use revenue projections to justify SEO investment to decision-makers — numbers talk.",
  },
  {
    id: "analytics",
    step: "K",
    title: "Analyze Performance",
    icon: BarChart3,
    color: "from-orange-500 to-amber-500",
    summary: "Deep-dive into traffic, engagement, and content performance data.",
    details: [
      "The Analytics dashboard aggregates data across all your content and keywords.",
      "Track impressions, clicks, CTR, and average position over time.",
      "Identify which content pieces drive the most traffic and conversions.",
      "Use performance trends to double down on what's working.",
    ],
    proTip: "Filter by date range to compare month-over-month performance improvements.",
  },
  {
    id: "checklist",
    step: "L",
    title: "SEO Checklist",
    icon: ListChecks,
    color: "from-teal-500 to-cyan-500",
    summary: "Ensure every piece of content meets SEO best practices before publishing.",
    details: [
      "The Checklist provides a categorized set of SEO requirements per content item.",
      "Items are auto-verified where possible (e.g., meta description length, heading structure).",
      "Manually verify items like 'internal links added' or 'images have alt text'.",
      "Aim for 100% completion before hitting publish.",
    ],
    proTip: "Use the checklist as a quality gate — never publish content that hasn't passed every item.",
  },
  {
    id: "leads",
    step: "M",
    title: "Capture Leads",
    icon: Users,
    color: "from-pink-500 to-rose-500",
    summary: "Turn your SEO reports into a lead generation machine.",
    details: [
      "When you share a public report, visitors can enter their email to access the full results.",
      "All captured emails appear in the Leads section with their associated scan data.",
      "Track when leads viewed their report and follow up accordingly.",
    ],
    proTip: "Share reports on LinkedIn with a teaser — the email gate captures warm leads automatically.",
  },
  {
    id: "team",
    step: "N",
    title: "Manage Your Team",
    icon: Users,
    color: "from-amber-500 to-yellow-500",
    summary: "Invite team members and assign roles for collaborative SEO management.",
    details: [
      "Navigate to Team to invite collaborators by email.",
      "Assign roles: Admin (full access), Operator (create & edit), Viewer (read-only).",
      "Team members inherit your brand settings and can contribute to the content pipeline.",
    ],
    proTip: "Give writers 'Operator' access so they can create content but not change brand settings.",
  },
  {
    id: "settings",
    step: "O",
    title: "Optimize Your Settings",
    icon: Settings,
    color: "from-gray-500 to-slate-500",
    summary: "Fine-tune webhooks, agent schedules, and integrations for maximum automation.",
    details: [
      "Connect Google Search Console for real ranking data import.",
      "Set up webhook URLs to auto-publish content to your CMS (e.g., Next.js, WordPress).",
      "Configure agent schedules for fully automated content production.",
      "Set revalidation prefixes for instant cache-busting on publish.",
    ],
    proTip: "The webhook + auto-schedule combo means you can run a content engine on complete autopilot.",
  },
];

const quickStartSteps = [
  { icon: Tag, label: "Set up your brand", time: "2 min" },
  { icon: Search, label: "Run keyword discovery", time: "1 min" },
  { icon: Bot, label: "Launch the agent pipeline", time: "1 min" },
  { icon: TrendingUp, label: "Check your first rankings", time: "30 sec" },
];

const Guide = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <img src={searcheraLogo} alt="Searchera" className="h-6 w-6 rounded-md" />
          <div>
            <h1 className="text-sm font-bold text-foreground">Searchera Guide</h1>
            <p className="text-[10px] text-muted-foreground">A-to-Z playbook for SEO domination</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        {/* Hero */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Quick Start</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Go from zero to optimized in under 5 minutes
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Follow these 4 steps to get your first content piece ranking.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickStartSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{step.label}</p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
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
          <h3 className="text-sm font-bold text-foreground">
            Complete Guide ({guideSections.length} sections)
          </h3>
          <div className="flex gap-2">
            <button onClick={expandAll} className="text-[11px] font-medium text-primary hover:underline">
              Expand all
            </button>
            <span className="text-muted-foreground">·</span>
            <button onClick={collapseAll} className="text-[11px] font-medium text-primary hover:underline">
              Collapse all
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {guideSections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections.has(section.id);
            return (
              <Collapsible key={section.id} open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-3 p-4 text-left">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${section.color} text-white text-xs font-bold`}>
                        {section.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h4 className="text-sm font-semibold text-foreground truncate">{section.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{section.summary}</p>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="border-t border-border pt-4 pb-4 space-y-3">
                      <ul className="space-y-2">
                        {section.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                      {section.proTip && (
                        <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2 flex items-start gap-2">
                          <Target className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                          <p className="text-[11px] text-foreground">
                            <span className="font-semibold text-primary">Pro Tip: </span>
                            {section.proTip}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h3 className="text-sm font-bold text-foreground mb-1">Ready to grow?</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Head to your dashboard and start with Step A — you'll be ranking in no time.
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
