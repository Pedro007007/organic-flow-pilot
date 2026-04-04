import { TrendingUp, TrendingDown } from "lucide-react";
import type { PerformanceMetric } from "@/types/seo";

interface MetricCardProps {
  metric: PerformanceMetric;
  index: number;
}

const MetricCard = ({ metric, index }: MetricCardProps) => {
  const isPositive = metric.change > 0;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl p-5 shadow-lg hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 ease-out animate-slide-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {metric.label}
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-mono drop-shadow-sm">
          {metric.value}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-success" />
          )}
          <span className="text-xs font-medium text-success">
            {isPositive ? "+" : ""}{metric.change}%
          </span>
          <span className="text-xs text-foreground/80">{metric.changeLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
