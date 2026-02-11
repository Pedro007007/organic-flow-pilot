import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, AlertTriangle, Target } from "lucide-react";

interface ExecutiveSummaryProps {
  data: any;
  domain: string;
  primaryColor: string;
  accentColor: string;
}

const ExecutiveSummary = ({ data, domain, primaryColor, accentColor }: ExecutiveSummaryProps) => {
  const score = data.seo_score || 0;
  const breakdown = data.score_breakdown || {};
  const revenue = data.revenue_opportunity || {};
  const growthIndex = data.growth_index || 0;
  const capturePercent = revenue.capture_percentage || 18;

  const priorityLevel = score >= 70 ? "Low" : score >= 50 ? "Medium" : score >= 30 ? "High" : "Critical";
  const priorityColor = score >= 70 ? "hsl(var(--success))" : score >= 50 ? accentColor : score >= 30 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold text-foreground">Your Search Revenue Opportunity Overview</h2>
        <p className="text-sm text-muted-foreground font-mono">{domain}</p>
      </div>

      {/* Top Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center space-y-2">
          <div className="relative h-16 w-16 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={primaryColor} strokeWidth="8" strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">{score}</span>
            </div>
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground">SEO Score</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center space-y-2">
          <DollarSign className="h-8 w-8 mx-auto" style={{ color: accentColor }} />
          <p className="text-lg font-bold text-foreground">£{(revenue.monthly_revenue_estimate || 0).toLocaleString()}</p>
          <p className="text-[10px] font-semibold text-muted-foreground">Monthly Opportunity</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center space-y-2">
          <Target className="h-8 w-8 mx-auto" style={{ color: primaryColor }} />
          <p className="text-lg font-bold text-foreground">{capturePercent}%</p>
          <p className="text-[10px] font-semibold text-muted-foreground">Revenue Captured</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto" style={{ color: priorityColor }} />
          <p className="text-lg font-bold text-foreground" style={{ color: priorityColor }}>{priorityLevel}</p>
          <p className="text-[10px] font-semibold text-muted-foreground">Priority Level</p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{data.summary || "Run a scan to see your SEO intelligence report."}</p>
        <p className="text-xs font-semibold text-foreground" style={{ color: primaryColor }}>
          Your website is currently capturing only {capturePercent}% of its potential organic revenue.
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Score Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: "Technical Health", value: breakdown.technical_health || 0, weight: "30%" },
            { label: "On-Page Optimization", value: breakdown.on_page || 0, weight: "20%" },
            { label: "Backlinks", value: breakdown.backlinks || 0, weight: "20%" },
            { label: "Content Authority", value: breakdown.content_authority || 0, weight: "15%" },
            { label: "Keyword Positioning", value: breakdown.keyword_positioning || 0, weight: "15%" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{item.label}</span>
              <Progress value={item.value} className="h-2 flex-1" />
              <span className="text-xs font-mono text-foreground w-10 text-right">{item.value}</span>
              <Badge variant="secondary" className="text-[9px] w-10 justify-center">{item.weight}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Searchera Growth Index™ */}
      <div className="rounded-lg border-2 p-5 text-center space-y-3" style={{ borderColor: primaryColor, background: `${primaryColor}08` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryColor }}>Searchera Growth Index™</p>
        <div className="relative h-24 w-24 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={primaryColor} strokeWidth="10" strokeDasharray={`${growthIndex * 2.64} 264`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{growthIndex}</span>
            <span className="text-[9px] text-muted-foreground">/100</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">A proprietary score blending all SEO metrics. Updates monthly.</p>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
