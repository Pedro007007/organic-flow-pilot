import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  BarChart3,
  Eye,
} from "lucide-react";

const RankingsTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rankings, setRankings] = useState<any[]>([]);
  const [citations, setCitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [view, setView] = useState<"table" | "chart">("table");

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [rankRes, citeRes] = await Promise.all([
      supabase.from("rankings").select("*").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(200),
      supabase.from("ai_citations").select("*").eq("user_id", user.id).order("checked_at", { ascending: false }).limit(100),
    ]);

    if (rankRes.data) setRankings(rankRes.data);
    if (citeRes.data) setCitations(citeRes.data);
    setLoading(false);
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await supabase.functions.invoke("rankings-check", {
        body: { userId: user?.id },
      });
      if (res.error) throw res.error;
      toast({ title: "Rankings updated", description: `${res.data?.updated || 0} entries refreshed` });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Check failed", description: err.message, variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  // Build unique latest rankings per keyword+url
  const latestMap = new Map<string, any>();
  rankings.forEach((r) => {
    const key = `${r.keyword}||${r.url}`;
    if (!latestMap.has(key)) latestMap.set(key, r);
  });
  const latestRankings = Array.from(latestMap.values());

  // Chart data: group by date
  const dateMap = new Map<string, { date: string; avgPosition: number; count: number }>();
  rankings.forEach((r) => {
    const d = r.snapshot_date;
    const entry = dateMap.get(d) || { date: d, avgPosition: 0, count: 0 };
    entry.avgPosition += Number(r.position || 0);
    entry.count += 1;
    dateMap.set(d, entry);
  });
  const chartData = Array.from(dateMap.values())
    .map((d) => ({ date: d.date, position: d.count > 0 ? Math.round(d.avgPosition / d.count) : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const PositionChange = ({ current, previous }: { current: number; previous: number | null }) => {
    if (!previous) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    const diff = previous - current;
    if (diff > 0) return <span className="flex items-center gap-0.5 text-success text-[11px] font-mono"><TrendingUp className="h-3 w-3" />+{diff}</span>;
    if (diff < 0) return <span className="flex items-center gap-0.5 text-destructive text-[11px] font-mono"><TrendingDown className="h-3 w-3" />{diff}</span>;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">AI SEO & Organic Rankings</h2>
            <p className="text-xs text-muted-foreground">{latestRankings.length} tracked URLs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")} className="h-7 px-2.5 text-xs">Table</Button>
          <Button size="sm" variant={view === "chart" ? "default" : "outline"} onClick={() => setView("chart")} className="h-7 px-2.5 text-xs">Chart</Button>
          <Button size="sm" variant="outline" onClick={handleCheck} disabled={checking} className="border-primary/30 text-primary hover:bg-primary/10">
            {checking ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>
      </div>

      {latestRankings.length === 0 && !loading ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No ranking data yet. Click Refresh to pull data from your connected search console.</p>
        </div>
      ) : view === "table" ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Keyword</TableHead>
                <TableHead className="text-xs">URL</TableHead>
                <TableHead className="text-xs text-center">Position</TableHead>
                <TableHead className="text-xs text-center">Change</TableHead>
                <TableHead className="text-xs text-center">AI Cited</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestRankings.map((r) => {
                const cite = citations.find((c) => c.url === r.url && c.cited);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-medium">{r.keyword}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground max-w-[200px] truncate">{r.url}</TableCell>
                    <TableCell className="text-center text-xs font-mono font-bold">#{Number(r.position)}</TableCell>
                    <TableCell className="text-center">
                      <PositionChange current={Number(r.position)} previous={r.previous_position ? Number(r.previous_position) : null} />
                    </TableCell>
                    <TableCell className="text-center">
                      {r.ai_cited || cite ? (
                        <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                          <Eye className="h-3 w-3 mr-0.5" />
                          {r.ai_engine || cite?.engine || "AI"}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.snapshot_date}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">Average Position Over Time (lower is better)</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis reversed tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RankingsTracker;
