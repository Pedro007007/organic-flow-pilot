import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, MousePointer, Eye, Hash } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(210, 100%, 68%)",
  "hsl(340, 82%, 65%)",
  "hsl(152, 70%, 50%)",
  "hsl(38, 92%, 60%)",
  "hsl(210, 80%, 55%)",
  "hsl(0, 72%, 55%)",
];

const AnalyticsDashboard = () => {
  const { user } = useAuth();

  const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ["analytics_snapshots", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: keywords, isLoading: keywordsLoading } = useQuery({
    queryKey: ["analytics_keywords", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .order("impressions", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ["analytics_content", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = snapshotsLoading || keywordsLoading || contentLoading;

  // Prepare chart data
  const trafficTrend = useMemo(() => {
    if (!snapshots?.length) return [];
    const grouped = new Map<string, { date: string; impressions: number; clicks: number }>();
    for (const s of snapshots) {
      const date = s.snapshot_date;
      const existing = grouped.get(date) || { date, impressions: 0, clicks: 0 };
      if (s.label.toLowerCase().includes("impression")) existing.impressions += Number(s.value.replace(/,/g, "")) || 0;
      if (s.label.toLowerCase().includes("click")) existing.clicks += Number(s.value.replace(/,/g, "")) || 0;
      grouped.set(date, existing);
    }
    return Array.from(grouped.values());
  }, [snapshots]);

  const keywordRankings = useMemo(() => {
    if (!keywords?.length) return [];
    return keywords.slice(0, 10).map((k) => ({
      keyword: k.keyword.length > 20 ? k.keyword.slice(0, 20) + "…" : k.keyword,
      position: Number(k.position),
      impressions: k.impressions,
    }));
  }, [keywords]);

  const contentByStatus = useMemo(() => {
    if (!content?.length) return [];
    const counts: Record<string, number> = {};
    for (const c of content) {
      counts[c.status] = (counts[c.status] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = (snapshots?.length || 0) + (keywords?.length || 0) + (content?.length || 0) > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No analytics data yet. Run agents to populate keywords, content, and performance snapshots.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Eye} label="Total Keywords" value={keywords?.length || 0} />
        <SummaryCard icon={Hash} label="Content Items" value={content?.length || 0} />
        <SummaryCard
          icon={MousePointer}
          label="Published"
          value={content?.filter((c) => c.status === "published" || c.status === "monitoring").length || 0}
        />
        <SummaryCard icon={TrendingUp} label="Snapshots" value={snapshots?.length || 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Traffic trend */}
        {trafficTrend.length > 0 && (
          <ChartCard title="Traffic Trend">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trafficTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 16%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 30%, 9%)",
                    border: "1px solid hsl(220, 25%, 16%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="impressions" stroke="hsl(210, 100%, 68%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="hsl(340, 82%, 65%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Content by status */}
        {contentByStatus.length > 0 && (
          <ChartCard title="Content by Stage">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={contentByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {contentByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "hsl(215, 15%, 55%)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 30%, 9%)",
                    border: "1px solid hsl(220, 25%, 16%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Keyword rankings bar chart */}
      {keywordRankings.length > 0 && (
        <ChartCard title="Top Keywords by Position">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={keywordRankings} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 25%, 16%)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <YAxis dataKey="keyword" type="category" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} width={140} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 30%, 9%)",
                  border: "1px solid hsl(220, 25%, 16%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="impressions" fill="hsl(210, 100%, 68%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-foreground font-mono">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default AnalyticsDashboard;
