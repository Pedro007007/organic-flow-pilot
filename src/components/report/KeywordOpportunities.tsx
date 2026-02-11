import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

interface KeywordOpportunitiesProps {
  data: any;
  primaryColor: string;
  accentColor: string;
}

const opportunityColors: Record<string, string> = {
  Critical: "hsl(var(--destructive))",
  High: "hsl(var(--warning))",
  Medium: "hsl(var(--info))",
  Low: "hsl(var(--success))",
};

const KeywordOpportunities = ({ data, primaryColor, accentColor }: KeywordOpportunitiesProps) => {
  const keywords = data.keyword_opportunities || [];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">Keyword Opportunity Analysis</h2>
        <p className="text-xs text-muted-foreground">Revenue-focused keyword gaps — this shows MONEY, not just traffic</p>
      </div>

      {keywords.length > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 px-4 py-2.5 border-b border-border">
            <span>Keyword</span>
            <span className="w-16 text-center">Volume</span>
            <span className="w-12 text-center">Pos.</span>
            <span className="w-20 text-center">Score</span>
            <span className="w-16 text-center">Value</span>
          </div>
          <div className="divide-y divide-border">
            {keywords.map((kw: any, i: number) => {
              const color = opportunityColors[kw.opportunity_score] || opportunityColors.Medium;
              return (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 items-center px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{kw.keyword}</p>
                    {kw.cpc && <p className="text-[10px] text-muted-foreground">CPC: £{kw.cpc}</p>}
                  </div>
                  <span className="text-xs font-mono text-foreground w-16 text-center">{(kw.volume || 0).toLocaleString()}</span>
                  <span className="text-xs font-mono text-foreground w-12 text-center">{kw.current_position || "—"}</span>
                  <Badge className="text-[9px] w-20 justify-center" style={{ backgroundColor: color }}>{kw.opportunity_score}</Badge>
                  <span className="text-xs font-mono w-16 text-center flex items-center justify-center gap-0.5">
                    <DollarSign className="h-3 w-3" style={{ color: accentColor }} />
                    {(kw.estimated_value || 0).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No keyword data available. Run a scan to discover opportunities.</p>
      )}

      {/* Opportunity Score Formula */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Opportunity Score Formula</p>
        <p className="text-xs font-mono text-foreground">(Volume × CPC × Rank Gap Factor)</p>
      </div>
    </div>
  );
};

export default KeywordOpportunities;
