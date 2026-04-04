import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Rocket, Bug, Zap, ChevronDown, ChevronUp, Calendar } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "feature" | "improvement" | "fix";
  title: string;
  description: string;
}

const changelog: ChangelogEntry[] = [
  { version: "2.4.0", date: "2026-04-04", type: "feature", title: "Onboarding Wizard", description: "New 3-step guided onboarding helps you connect GSC, set up your brand, and run keyword discovery in minutes." },
  { version: "2.3.0", date: "2026-04-01", type: "feature", title: "AI Citation Tracker", description: "Monitor your brand mentions across ChatGPT, Perplexity, and Google AI Overviews in real time." },
  { version: "2.2.1", date: "2026-03-28", type: "improvement", title: "Content Pipeline Upgrades", description: "Faster content generation with improved SERP research, better internal linking, and enhanced schema markup." },
  { version: "2.2.0", date: "2026-03-20", type: "feature", title: "LLM Search Lab", description: "Discover how AI search engines interpret your content with our new LLM Search simulation tool." },
  { version: "2.1.0", date: "2026-03-12", type: "feature", title: "SEO & AEO Fulfilment Engine", description: "Automated quality checks ensure every piece of content meets on-page SEO, technical SEO, schema markup, and AEO standards." },
  { version: "2.0.1", date: "2026-03-05", type: "fix", title: "Dashboard Performance Fix", description: "Resolved metric loading delays and improved real-time subscription stability for large datasets." },
  { version: "2.0.0", date: "2026-02-28", type: "feature", title: "Autonomous Agent Pipeline", description: "7-stage AI agent pipeline automates keyword discovery, content strategy, generation, optimization, and publishing." },
];

const typeConfig = {
  feature: { icon: Rocket, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20", label: "New" },
  improvement: { icon: Zap, color: "bg-blue-500/15 text-blue-600 border-blue-500/20", label: "Improved" },
  fix: { icon: Bug, color: "bg-amber-500/15 text-amber-600 border-amber-500/20", label: "Fix" },
};

const Changelog = () => {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const visibleEntries = showAll ? changelog : changelog.slice(0, 4);

  return (
    <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors rounded-t-2xl"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground">What's New</h3>
            <p className="text-xs text-muted-foreground">Latest updates & features</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4">
          <ScrollArea className={showAll ? "max-h-[400px]" : ""}>
            <div className="space-y-3">
              {visibleEntries.map((entry, i) => {
                const config = typeConfig[entry.type];
                const Icon = config.icon;
                return (
                  <div
                    key={`${entry.version}-${i}`}
                    className="group flex gap-3 rounded-xl border border-border/30 bg-gradient-to-r from-muted/15 to-transparent p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-400"
                  >
                    <div className="mt-0.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shadow-sm">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground">{entry.title}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${config.color}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{entry.description}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Calendar className="h-2.5 w-2.5 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/60 font-medium">{entry.date}</span>
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className="text-[10px] text-muted-foreground/60 font-medium">v{entry.version}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {changelog.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {showAll ? "Show less" : `View all ${changelog.length} updates`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Changelog;
