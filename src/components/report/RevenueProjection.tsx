import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RevenueProjectionProps {
  data: any;
  primaryColor: string;
  accentColor: string;
}

const RevenueProjection = ({ data, primaryColor, accentColor }: RevenueProjectionProps) => {
  const rev = data.revenue_opportunity || {};
  const currentTraffic = rev.current_traffic || 0;
  const potentialTraffic = rev.potential_traffic || 0;
  const convRate = rev.conversion_rate || 0.03;
  const avgValue = rev.avg_customer_value || 0;
  const annualPotential = rev.annual_revenue_potential || 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">Revenue Projection Model</h2>
        <p className="text-xs text-muted-foreground">SEO as investment, not cost</p>
      </div>

      {/* Traffic comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div className="rounded-lg border border-border bg-card p-4 text-center space-y-2">
          <p className="text-[10px] text-muted-foreground">Current Traffic</p>
          <p className="text-xl font-bold text-foreground">{currentTraffic.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">/month</p>
        </div>
        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6" style={{ color: primaryColor }} />
        </div>
        <div className="rounded-lg border-2 bg-card p-4 text-center space-y-2" style={{ borderColor: primaryColor }}>
          <p className="text-[10px] text-muted-foreground">Potential Traffic</p>
          <p className="text-xl font-bold" style={{ color: primaryColor }}>{potentialTraffic.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">/month</p>
        </div>
      </div>

      {/* Revenue Calculation */}
      <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-4">
        <p className="text-xs font-bold text-foreground text-center">Revenue Calculation</p>
        <div className="space-y-3">
          {[
            { label: "Potential Monthly Traffic", value: potentialTraffic.toLocaleString() },
            { label: "Conversion Rate", value: `${(convRate * 100).toFixed(1)}%` },
            { label: "Average Customer Value", value: `£${avgValue.toLocaleString()}` },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="text-xs font-mono font-semibold text-foreground">{r.value}</p>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">Projected Annual Revenue</p>
            <p className="text-lg font-bold" style={{ color: accentColor }}>
              £{annualPotential.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="rounded-lg border border-border bg-card p-4 text-center space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Formula</p>
        <p className="text-xs font-mono text-foreground">
          {potentialTraffic.toLocaleString()} × {(convRate * 100).toFixed(0)}% × £{avgValue.toLocaleString()} × 12 = <span className="font-bold" style={{ color: accentColor }}>£{annualPotential.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
};

export default RevenueProjection;
