import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, BarChart3, Eye, ArrowRight, Search, Globe, Zap, HelpCircle, ChevronDown,
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
      const res = await supabase.functions.invoke("rankings-check", { body: {} });
      if (res.error) throw res.error;
      toast({ title: "Rankings updated", description: `${res.data?.updated || 0} entries refreshed` });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Check failed", description: err.message, variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const latestMap = new Map<string, any>();
  rankings.forEach((r) => {
    const key = `${r.keyword}||${r.url}`;
    if (!latestMap.has(key)) latestMap.set(key, r);
  });
  const latestRankings = Array.from(latestMap.values());

  const aiCitedCount = latestRankings.filter((r) => r.ai_cited).length;
  const avgPosition = latestRankings.length > 0
    ? Math.round(latestRankings.reduce((sum, r) => sum + Number(r.position || 0), 0) / latestRankings.length)
    : 0;

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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl p-8 text-center space-y-4 shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">AI SEO & Organic Rankings Tracker</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Track how your pages rank in Google search and AI answer engines. Monitor position changes and AI citation visibility.
        </p>
        <Button onClick={handleCheck} disabled={checking} className="mx-auto">
          {checking ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
          Refresh Rankings
        </Button>
      </div>

      {/* How It Works Guide */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors group">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">How does the Rankings Tracker work?</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="rounded-xl border border-border bg-card mt-2 p-6 space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">📡 Data Flow</h3>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Your published content (from the Content Pipeline) gets tracked automatically — each content item with a URL and keyword becomes a tracked entry.</li>
              <li>Clicking <strong className="text-foreground">Refresh Rankings</strong> checks your actual Google position for each keyword/URL pair and whether AI engines cite your page.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">📊 What the columns mean</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Position", desc: "Your Google SERP ranking for that keyword" },
                { label: "Change", desc: "Position movement since the last check (↑ improved, ↓ dropped)" },
                { label: "AI Cited", desc: "Whether AI answer engines (ChatGPT, Perplexity, Google AI) reference your URL" },
                { label: "Date", desc: "When the last ranking check ran" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">🚀 Tips to get more value</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
              <li><strong className="text-foreground">Publish more content</strong> — Each published article with a URL automatically gets tracked here.</li>
              <li><strong className="text-foreground">Refresh regularly</strong> — Click "Refresh Rankings" to pull live position data from Google.</li>
              <li><strong className="text-foreground">Use Chart View</strong> — Over time it shows position trends so you can spot content climbing or dropping.</li>
              <li><strong className="text-foreground">Watch AI Citations</strong> — This tells you if AI search engines are citing your content, increasingly important for organic traffic.</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracked URLs</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{latestRankings.length}</p>
          <Progress value={Math.min(latestRankings.length * 10, 100)} className="h-1.5" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Position</p>
          </div>
          <p className="text-2xl font-bold text-foreground">#{avgPosition || "—"}</p>
          <Progress value={avgPosition > 0 ? Math.max(100 - avgPosition, 10) : 0} className="h-1.5" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-info" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Citations</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{aiCitedCount}</p>
          <Progress value={latestRankings.length > 0 ? Math.round((aiCitedCount / latestRankings.length) * 100) : 0} className="h-1.5" />
        </div>
      </div>

      {/* View Toggle + Content */}
      <div className="flex items-center gap-2 mb-2">
        <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")} className="text-xs">Table View</Button>
        <Button size="sm" variant={view === "chart" ? "default" : "outline"} onClick={() => setView("chart")} className="text-xs">Chart View</Button>
      </div>

      {latestRankings.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Globe, title: "Connect Search Console", desc: "Link your Google Search Console to pull real ranking data and track position changes over time.", cta: "Connect GSC" },
            { icon: Zap, title: "AI Citation Tracking", desc: "See which of your pages are being cited by AI engines like Google AI Overviews, ChatGPT, and Perplexity.", cta: "Start Tracking" },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="flex items-center gap-2">
                <card.icon className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{card.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              <Button className="w-full" size="sm">{card.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      ) : view === "table" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                    <TableCell className="text-center"><PositionChange current={Number(r.position)} previous={r.previous_position ? Number(r.previous_position) : null} /></TableCell>
                    <TableCell className="text-center">
                      {r.ai_cited || cite ? (
                        <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                          <Eye className="h-3 w-3 mr-0.5" />{r.ai_engine || cite?.engine || "AI"}
                        </Badge>
                      ) : <span className="text-[10px] text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.snapshot_date}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground mb-4">Average Position Over Time (lower is better)</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis reversed tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between rounded-lg border-l-4 border-l-primary bg-card border border-border p-5">
        <div>
          <p className="text-sm font-bold text-foreground">Want to Improve Your Rankings?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Optimize your content for both traditional search and AI engines to maximize visibility.</p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0">Optimize Now</Button>
      </div>
    </div>
  );
};

export default RankingsTracker;
