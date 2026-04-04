import { forwardRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Users } from "lucide-react";

interface CompetitorGapProps {
  data: any;
  domain: string;
  primaryColor: string;
}

const CompetitorGap = ({ data, domain, primaryColor }: CompetitorGapProps) => {
  const gap = data.competitor_gap || {};

  const comparisons = [
    { label: "Domain Authority", yours: gap.domain_authority || 0, theirs: gap.competitor_da || 0, max: 100 },
    { label: "Referring Domains", yours: gap.referring_domains || 0, theirs: gap.competitor_referring_domains || 0, max: Math.max(gap.referring_domains || 1, gap.competitor_referring_domains || 1) },
    { label: "Content Volume", yours: gap.content_volume || 0, theirs: gap.competitor_content_volume || 0, max: Math.max(gap.content_volume || 1, gap.competitor_content_volume || 1) },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">Competitor Gap Intelligence</h2>
        <p className="text-xs text-muted-foreground">{domain}</p>
      </div>

      {/* Alert Banner */}
      <div className="rounded-lg border-l-4 p-4 bg-destructive/5" style={{ borderLeftColor: "hsl(var(--destructive))" }}>
        <div className="flex items-start gap-2">
          <TrendingDown className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">
              Competitors rank for {(gap.keywords_gap_count || 0).toLocaleString()} keywords you don't.
            </p>
            <p className="text-xs text-foreground/80 mt-0.5">
              Estimated lost monthly traffic: <span className="font-semibold text-foreground">{(gap.estimated_lost_traffic || 0).toLocaleString()} visits</span>
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Bars */}
      <div className="space-y-4">
        {comparisons.map((c) => (
          <div key={c.label} className="space-y-2">
            <p className="text-xs font-semibold text-foreground">{c.label}</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-foreground/70 w-16 shrink-0">You</span>
                <Progress value={(c.yours / c.max) * 100} className="h-2 flex-1" />
                <span className="text-xs font-mono text-foreground w-12 text-right">{c.yours}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-foreground/70 w-16 shrink-0">Competitor</span>
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.theirs / c.max) * 100}%`, backgroundColor: primaryColor + "60" }} />
                </div>
                <span className="text-xs font-mono text-foreground w-12 text-right">{c.theirs}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Competitor Pages */}
      {gap.top_competitor_pages?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">Top Competitor Pages</p>
          <div className="space-y-1">
            {gap.top_competitor_pages.map((page: string, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <Badge variant="secondary" className="text-[9px] w-5 h-5 p-0 justify-center shrink-0">{i + 1}</Badge>
                <p className="text-xs text-foreground/70 truncate">{page}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorGap;
