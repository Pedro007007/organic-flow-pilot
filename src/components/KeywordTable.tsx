import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { KeywordOpportunity } from "@/types/seo";
import { Badge } from "@/components/ui/badge";

const intentColors: Record<string, string> = {
  informational: "bg-info/15 text-info border-info/20",
  commercial: "bg-warning/15 text-warning border-warning/20",
  transactional: "bg-success/15 text-success border-success/20",
  local: "bg-primary/15 text-primary border-primary/20",
};

const opportunityColors: Record<string, string> = {
  high: "bg-success/15 text-success border-success/20",
  medium: "bg-warning/15 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

interface KeywordTableProps {
  keywords: KeywordOpportunity[];
}

const KeywordTable = ({ keywords }: KeywordTableProps) => {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Keyword Opportunities</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Ranked by opportunity score from GSC data</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Keyword</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Intent</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Impressions</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Position</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">CTR</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Opportunity</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw) => (
              <tr key={kw.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-foreground">{kw.keyword}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{kw.contentType}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${intentColors[kw.searchIntent]}`}>
                    {kw.searchIntent}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-foreground">
                  {kw.impressions.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-mono text-sm text-foreground">{kw.position}</span>
                    {kw.position <= 10 ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : kw.position <= 20 ? (
                      <Minus className="h-3 w-3 text-warning" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-foreground">
                  {kw.ctr}%
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${opportunityColors[kw.opportunity]}`}>
                    {kw.opportunity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeywordTable;
