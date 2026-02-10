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
      className="rounded-lg border border-border bg-card p-5 animate-slide-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {metric.label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-mono">
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
        <span className="text-xs text-muted-foreground">{metric.changeLabel}</span>
      </div>
    </div>
  );
};

export default MetricCard;
