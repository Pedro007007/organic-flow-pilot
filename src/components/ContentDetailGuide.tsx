import { useState } from "react";
import { HelpCircle, X, ChevronDown, ChevronUp, FileText, Sparkles, Search, BarChart3, Share2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  {
    icon: FileText,
    title: "1. Content & Metadata",
    description: "Your main workspace for writing and configuring articles.",
    steps: [
      "**Content Draft** — Toggle between Edit (markdown editor) and Preview (rendered blog view). In Edit mode, use Rewrite, Expand, Shorten, or select text and Rewrite Selection to refine your copy.",
      "**Hero Image** — Generate or regenerate a cinematic 16:9 hero image from your article's keyword and title.",
      "**SERP Research** — If competitor intelligence was gathered, it appears here showing content gaps, competitor weaknesses, and word count targets.",
      "**SEO Metadata** — Click Generate to auto-create an optimised SEO title (≤60 chars), meta description (≤155 chars), and URL slug. Edit them manually anytime.",
      "**Details Panel** — Shows the keyword, author, schema types, article URL, and last update date.",
    ],
  },
  {
    icon: BarChart3,
    title: "2. Optimization",
    description: "Score your content across five SEO dimensions and get a prioritised action plan.",
    steps: [
      "Click **Run Optimization** to score your article on Technical SEO, On-Page SEO, Readability, Internal Linking, and Content Depth.",
      "Review the **overall score** and each dimension's breakdown.",
      "Follow the **Action Plan** — tasks are sorted by impact and effort so you can focus on quick wins first.",
    ],
  },
  {
    icon: Sparkles,
    title: "3. AEO (Answer Engine Optimization)",
    description: "Optimise your content for AI-powered search engines like ChatGPT and Gemini.",
    steps: [
      "Run the **AEO Score** to see how well your content is structured for AI citation.",
      "Review recommendations to improve FAQ sections, direct answers, and structured data.",
      "Higher AEO scores increase your chances of being cited in AI-generated answers.",
    ],
  },
  {
    icon: CheckCircle,
    title: "4. SEO/GEO Fulfilment",
    description: "A detailed checklist verifying your published content meets all SEO standards.",
    steps: [
      "After publishing, run the **Fulfilment Scan** against your live URL.",
      "Review pass/fail criteria across categories like meta tags, schema markup, mobile-friendliness, and Core Web Vitals.",
      "Use the results to fix any issues before promoting the content.",
    ],
  },
  {
    icon: Share2,
    title: "5. Repurpose",
    description: "Transform your long-form article into platform-specific content.",
    steps: [
      "**LinkedIn Post** — Generates a hook-driven professional post with key takeaways.",
      "**YouTube Description** — Creates a detailed description with timestamp placeholders and CTAs.",
      "**Twitter/X Thread** — Produces a numbered thread optimised for engagement.",
      "Each format respects your brand's tone of voice. Click Copy to grab the output or Regenerate for a new version.",
    ],
  },
];

const ContentDetailGuide = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-7 text-xs gap-1.5"
      >
        <HelpCircle className="h-3 w-3" />
        Guide
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 mb-6 relative">
      <button
        onClick={() => setOpen(false)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <HelpCircle className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Content Article Guide</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Step-by-step walkthrough of every feature available on this page.
      </p>

      <div className="space-y-2">
        {sections.map((section, i) => {
          const Icon = section.icon;
          const isExpanded = expanded === i;

          return (
            <div key={i} className="rounded-md border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                  <ul className="space-y-1.5">
                    {section.steps.map((step, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary font-bold mt-px">›</span>
                        <span dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-md bg-muted/50 border border-border px-4 py-3">
        <p className="text-[10px] text-muted-foreground">
          <strong className="text-foreground">Workflow tip:</strong> Use the stage bar at the top to track progress from Discovery → Monitoring. Click any stage to move your article forward or back. When ready, click Publish to push your content live.
        </p>
      </div>
    </div>
  );
};

export default ContentDetailGuide;
