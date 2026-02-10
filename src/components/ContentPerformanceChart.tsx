import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ContentPerformanceChartProps {
  contentId: string;
  keyword: string;
}

const ContentPerformanceChart = ({ contentId, keyword }: ContentPerformanceChartProps) => {
  const { user } = useAuth();

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["content_performance", contentId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get performance snapshots related to this content's URL/keyword
      const { data, error } = await supabase
        .from("performance_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (!snapshots?.length) return [];
    const grouped = new Map<string, { date: string; impressions: number; clicks: number; position: number }>();
    for (const s of snapshots) {
      const date = s.snapshot_date;
      const existing = grouped.get(date) || { date, impressions: 0, clicks: 0, position: 0 };
      const label = s.label.toLowerCase();
      const val = Number(s.value.replace(/,/g, "")) || 0;
      if (label.includes("impression")) existing.impressions += val;
      if (label.includes("click")) existing.clicks += val;
      if (label.includes("position") || label.includes("rank")) existing.position = val;
      grouped.set(date, existing);
    }
    return Array.from(grouped.values());
  }, [snapshots]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground">No performance data yet. Publish content and wait for GSC data to populate.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Performance Over Time</h3>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Impressions" />
            <Line type="monotone" dataKey="clicks" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Clicks" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ContentPerformanceChart;
