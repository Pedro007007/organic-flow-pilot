import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Search, Plus, Sparkles, Clock, Target, AlertTriangle, TrendingUp, DollarSign, HelpCircle, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

interface QueryResult {
  query: string;
  intent: string;
  volume_tier: string;
  reasoning: string;
  search_volume: number | null;
  cpc: number | null;
  competition: number | null;
  competition_level: string | null;
  monthly_searches: MonthlySearch[];
  data_source: "dataforseo" | "ai_estimate";
  match_type: "matched" | "partial" | "gap";
  matched_keyword: {
    keyword: string;
    intent: string;
    impressions: number;
    position: number;
    clicks: number;
  } | null;
}

interface Session {
  id: string;
  prompt: string;
  queries: any[];
  keyword_matches: QueryResult[];
  created_at: string;
}

const intentColors: Record<string, string> = {
  informational: "bg-info/15 text-info border-info/30",
  commercial: "bg-warning/15 text-warning border-warning/30",
  transactional: "bg-success/15 text-success border-success/30",
  navigational: "bg-primary/15 text-primary border-primary/30",
};

const matchColors: Record<string, string> = {
  matched: "bg-success/15 text-success border-success/30",
  partial: "bg-warning/15 text-warning border-warning/30",
  gap: "bg-destructive/15 text-destructive border-destructive/30",
};

const compColors: Record<string, string> = {
  LOW: "text-success",
  MEDIUM: "text-warning",
  HIGH: "text-destructive",
};

function MiniTrend({ data }: { data: MonthlySearch[] }) {
  if (!data || data.length === 0) return <span className="text-muted-foreground">—</span>;
  const last12 = data.slice(-12);
  const max = Math.max(...last12.map((d) => d.search_volume), 1);
  return (
    <div className="flex items-end gap-px h-5">
      {last12.map((d, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm bg-primary/60"
          style={{ height: `${Math.max((d.search_volume / max) * 100, 8)}%` }}
          title={`${d.month}/${d.year}: ${d.search_volume.toLocaleString()}`}
        />
      ))}
    </div>
  );
}

function formatVolume(vol: number | null, tier: string): string {
  if (vol !== null && vol !== undefined && vol > 0) return vol.toLocaleString();
  if (vol === 0) return "< 10";
  return tier; // fallback to AI estimate
}

const LlmSearchLab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsFetched, setSessionsFetched] = useState(false);
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);

  // Fetch past sessions
  if (!sessionsFetched && user) {
    setSessionsFetched(true);
    supabase
      .from("llm_search_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setSessions(data as unknown as Session[]);
      });
  }

  const handleSearch = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await supabase.functions.invoke("llm-search", {
        body: { prompt: prompt.trim() },
      });
      if (res.error) {
        const errBody = res.error?.context ? await res.error.context.json?.() : null;
        throw new Error(errBody?.error || res.error.message || "Search failed");
      }
      const queries = res.data?.queries || [];
      setResults(queries);
      const { data: updated } = await supabase
        .from("llm_search_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (updated) setSessions(updated as unknown as Session[]);
      toast({ title: "Search complete", description: `Found ${queries.length} queries` });
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async (q: QueryResult) => {
    if (!user) return;
    setAddingKeyword(q.query);
    try {
      const insertData: any = {
        user_id: user.id,
        keyword: q.query,
        search_intent: q.intent,
        opportunity: q.competition_level === "HIGH" ? "high" : q.competition_level === "MEDIUM" ? "medium" : "low",
      };
      if (q.search_volume !== null) insertData.impressions = q.search_volume;
      const { error } = await supabase.from("keywords").insert(insertData);
      if (error) throw error;
      toast({ title: "Keyword added", description: q.query });
      setResults((prev) =>
        prev.map((r) => (r.query === q.query ? { ...r, match_type: "matched" as const } : r))
      );
    } catch (err: any) {
      toast({ title: "Failed to add keyword", description: err.message, variant: "destructive" });
    } finally {
      setAddingKeyword(null);
    }
  };

  const loadSession = (session: Session) => {
    setPrompt(session.prompt);
    setResults(session.keyword_matches || []);
  };

  const gapCount = results.filter((r) => r.match_type === "gap").length;
  const matchCount = results.filter((r) => r.match_type === "matched").length;
  const hasRealData = results.some((r) => r.data_source === "dataforseo");

  return (
    <div className="space-y-6">
      {/* Search input */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">LLM Search Intelligence</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Enter a topic and discover what queries AI models use to research it. Enriched with real search volume, CPC &amp; competition data.
        </p>
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a topic, e.g. 'best CRM for small business'"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading || !prompt.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Search className="h-4 w-4 mr-1.5" />}
            Search
          </Button>
        </div>
      </Card>

      {/* User guide */}
      <Collapsible open={showGuide} onOpenChange={setShowGuide}>
        <Card className="p-0 overflow-hidden">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors">
            <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              How to read results
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showGuide ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground border-t border-border pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Volume</p>
                  <p>Average monthly Google searches. Higher = more people searching. Shows "est." with a tier label when exact data isn't available.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">CPC (Cost Per Click)</p>
                  <p>How much advertisers pay per click on Google Ads. Higher CPC = more commercial value. A $5+ CPC keyword is worth targeting.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Competition</p>
                  <p>How many advertisers bid on this keyword. LOW = easier to rank for, HIGH = very competitive.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Trend</p>
                  <p>12-month sparkline showing seasonal patterns. Rising bars = growing interest. Flat = steady demand.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Intent</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li><span className="font-medium text-info">Informational</span> — wants to learn</li>
                    <li><span className="font-medium text-warning">Commercial</span> — comparing options</li>
                    <li><span className="font-medium text-success">Transactional</span> — ready to buy</li>
                    <li><span className="font-medium text-primary">Navigational</span> — looking for a specific site</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Match Status</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li><span className="font-medium text-success">Matched</span> — you already track this keyword</li>
                    <li><span className="font-medium text-warning">Partial</span> — similar keyword exists in your tracker</li>
                    <li><span className="font-medium text-destructive">Gap</span> — nobody is targeting this yet — your opportunity</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-border pt-2">
                <p className="font-semibold text-foreground mb-0.5">💡 What to look for</p>
                <p>Prioritise <span className="font-medium text-destructive">gaps</span> with high volume, low competition, and commercial/transactional intent. Click <span className="font-medium text-foreground">Add</span> to send them to your keyword tracker.</p>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Results summary */}
      {results.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-xs gap-1">
            <Target className="h-3 w-3" /> {results.length} queries
          </Badge>
          <Badge variant="outline" className={`text-xs gap-1 ${matchColors.matched}`}>
            {matchCount} matched
          </Badge>
          <Badge variant="outline" className={`text-xs gap-1 ${matchColors.gap}`}>
            <AlertTriangle className="h-3 w-3" /> {gapCount} gaps
          </Badge>
          {hasRealData && (
            <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/30">
              <TrendingUp className="h-3 w-3" /> Real data
            </Badge>
          )}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Query</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Intent</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-foreground">Volume</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-foreground">CPC</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Comp.</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Trend</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Match</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((q, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="font-medium text-foreground">{q.query}</p>
                      <p className="text-muted-foreground mt-0.5 truncate">{q.reasoning}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${intentColors[q.intent] || ""}`}>
                        {q.intent}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-medium text-foreground">
                        {formatVolume(q.search_volume, q.volume_tier)}
                      </span>
                      {q.data_source === "ai_estimate" && q.search_volume === null && (
                        <span className="block text-[10px] text-muted-foreground">est.</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {q.cpc !== null ? (
                        <span className="text-foreground flex items-center justify-end gap-0.5">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {q.cpc.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {q.competition_level && q.competition_level !== "UNKNOWN" ? (
                        <span className={`font-medium text-[10px] uppercase ${compColors[q.competition_level] || "text-muted-foreground"}`}>
                          {q.competition_level}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <MiniTrend data={q.monthly_searches || []} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${matchColors[q.match_type]}`}>
                        {q.match_type === "matched" ? "✓ Matched" : q.match_type === "partial" ? "~ Partial" : "✗ Gap"}
                      </Badge>
                      {q.matched_keyword && (
                        <p className="text-muted-foreground mt-0.5">
                          → {q.matched_keyword.keyword} (pos {q.matched_keyword.position})
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {q.match_type !== "matched" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          disabled={addingKeyword === q.query}
                          onClick={() => handleAddKeyword(q)}
                        >
                          {addingKeyword === q.query ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Add
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Session history */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Recent Sessions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s)}
                className="text-left rounded-md border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
              >
                <p className="text-xs font-medium text-foreground truncate">{s.prompt}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {(s.keyword_matches || []).length} queries • {new Date(s.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LlmSearchLab;
