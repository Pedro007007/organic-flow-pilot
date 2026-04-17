import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, MousePointer, Eye, Hash, RefreshCw, Link2, AlertCircle } from "lucide-react";
import KeywordMovers from "@/components/analytics/KeywordMovers";
import AiCitationRate from "@/components/analytics/AiCitationRate";
import TopPagesPerformance from "@/components/analytics/TopPagesPerformance";
import ContentVelocity from "@/components/analytics/ContentVelocity";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data: gscStatus } = useQuery({
    queryKey: ["gsc_status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("gsc-oauth", { body: { action: "status" } });
      return data || { configured: false, connected: false };
    },
  });

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

  const handleSyncGsc = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("gsc-oauth", { body: { action: "sync" } });
    setSyncing(false);
    if (error || !data?.success) {
      toast({ title: "Sync failed", description: error?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "GSC synced", description: `${data.keywords_created || 0} keywords, ${data.snapshots_created || 0} snapshots` });
      queryClient.invalidateQueries({ queryKey: ["analytics_snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["analytics_keywords"] });
    }
  };

  const { data: keywords, isLoading: keywordsLoading } = useQuery({
    queryKey: ["analytics_keywords", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .order("impressions", { ascending: false })
        .limit(200);
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
    const map = new Map<string, { keyword: string; impressions: number; positions: number[] }>();
    for (const k of keywords) {
      const key = k.keyword.trim().toLowerCase();
      const entry = map.get(key) ?? { keyword: k.keyword, impressions: 0, positions: [] };
      entry.impressions += k.impressions ?? 0;
      const pos = Number(k.position);
      if (pos > 0) entry.positions.push(pos);
      map.set(key, entry);
    }
    return Array.from(map.values())
      .map((e) => ({
        keyword: e.keyword.length > 30 ? e.keyword.slice(0, 30) + "…" : e.keyword,
        impressions: e.impressions,
        position: e.positions.length ? e.positions.reduce((a, b) => a + b, 0) / e.positions.length : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);
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
  const noSnapshots = (snapshots?.length || 0) === 0;

  if (!hasData) {
    const notConfigured = !gscStatus?.configured;
    const notConnected = gscStatus?.configured && !gscStatus?.connected;
    return (
      <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl p-8 text-center shadow-md space-y-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        {notConfigured ? (
          <>
            <p className="text-sm font-semibold text-foreground">Google Search Console not configured</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Set up GSC credentials in Settings to start tracking real impressions, clicks, and rankings.
            </p>
          </>
        ) : notConnected ? (
          <>
            <p className="text-sm font-semibold text-foreground">Connect Google Search Console</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              You're not connected yet. Open Settings → Integrations to link your GSC account.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">No analytics data yet</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              GSC is connected but you haven't synced. Click below to import your first snapshot.
            </p>
            <Button size="sm" onClick={handleSyncGsc} disabled={syncing}>
              {syncing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Sync Now
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync prompt when connected but no snapshots */}
      {gscStatus?.connected && noSnapshots && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">GSC connected — no snapshots yet</p>
              <p className="text-xs text-muted-foreground">Sync now to pull rankings, clicks, and impressions into your analytics.</p>
            </div>
          </div>
          <Button size="sm" onClick={handleSyncGsc} disabled={syncing} className="shrink-0">
            {syncing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Sync Now
          </Button>
        </div>
      )}

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
            <div className="flex flex-col sm:flex-row items-center gap-4 overflow-visible">
              <ResponsiveContainer width={220} height={220} className="flex-shrink-0">
                <PieChart>
                  <Pie
                    data={contentByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {contentByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap sm:flex-col gap-2 justify-center min-w-0">
                {contentByStatus.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs min-w-0">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-muted-foreground capitalize whitespace-nowrap">
                      {entry.name}
                    </span>
                    <span className="font-mono font-semibold text-foreground flex-shrink-0">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Keyword rankings bar chart */}
      {keywordRankings.length > 0 && (
        <ChartCard title="Top Keywords by Impressions">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={keywordRankings} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 500 }} />
              <YAxis dataKey="keyword" type="category" tick={{ fontSize: 13, fill: "hsl(var(--foreground))", fontWeight: 600 }} width={200} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsla(220, 15%, 10%, 0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid hsla(220, 20%, 40%, 0.35)",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#fff",
                }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="impressions" fill="hsl(210, 100%, 68%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Keyword Movers */}
      <KeywordMovers />

      {/* AI Citation Rate & Content Velocity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AiCitationRate />
        <ContentVelocity />
      </div>

      {/* Top Pages */}
      <TopPagesPerformance />
    </div>
  );
};

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl p-4 shadow-md transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="mt-1 text-2xl font-bold text-foreground font-mono drop-shadow-sm">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.01] via-transparent to-transparent pointer-events-none" />
      <div className="border-b border-border/30 px-5 py-4 relative z-10">
        <h3 className="text-sm font-bold text-foreground tracking-wide">{title}</h3>
      </div>
      <div className="p-5 relative z-10">{children}</div>
    </div>
  );
}

export default AnalyticsDashboard;
