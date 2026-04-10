import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, Wand2 } from "lucide-react";

interface OptimizationTabProps {
  contentItemId: string;
}

interface ScoreBreakdown {
  technical: number;
  on_page: number;
  readability: number;
  internal_links: number;
  content_depth: number;
}

interface ActionItem {
  action: string;
  dimension: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  priority: number;
}

interface OptimizationJob {
  id: string;
  overall_score: number | null;
  scores: ScoreBreakdown | null;
  action_plan: ActionItem[] | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const dimensionLabels: Record<string, { label: string; weight: string }> = {
  technical: { label: "Technical SEO", weight: "25%" },
  on_page: { label: "On-Page SEO", weight: "25%" },
  readability: { label: "Readability", weight: "20%" },
  internal_links: { label: "Internal Linking", weight: "15%" },
  content_depth: { label: "Content Depth", weight: "15%" },
};

const effortColors: Record<string, string> = {
  low: "bg-success/15 text-success border-success/20",
  medium: "bg-warning/15 text-warning border-warning/20",
  high: "bg-destructive/15 text-destructive border-destructive/20",
};

const impactColors: Record<string, string> = {
  high: "bg-success/15 text-success border-success/20",
  medium: "bg-warning/15 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

function getScoreColor(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function getScoreTrackColor(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
}

const ScoreRing = ({ score }: { score: number }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={score >= 75 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
};

const OptimizationTab = ({ contentItemId }: OptimizationTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [job, setJob] = useState<OptimizationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [fixingDimension, setFixingDimension] = useState<string | null>(null);
  const [fixingAll, setFixingAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("optimization_jobs")
      .select("*")
      .eq("content_item_id", contentItemId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setLoading(false);
        if (data && data.length > 0) {
          const row = data[0];
          setJob({
            id: row.id,
            overall_score: row.overall_score,
            scores: row.scores as unknown as ScoreBreakdown | null,
            action_plan: row.action_plan as unknown as ActionItem[] | null,
            status: row.status,
            created_at: row.created_at,
            completed_at: row.completed_at,
          });
        }
      });
  }, [user, contentItemId]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await supabase.functions.invoke("optimization-score", {
        body: { contentItemId },
      });
      if (res.error) throw res.error;
      const d = res.data;
      setJob({
        id: d.jobId,
        overall_score: d.overall_score,
        scores: d.scores,
        action_plan: d.action_plan,
        status: "completed",
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
      toast({ title: `SEO Score: ${d.overall_score}/100`, description: `${d.action_plan?.length || 0} actions recommended` });
    } catch (err: any) {
      toast({ title: "Optimization scan failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const handleFixDimension = async (dimension: string) => {
    if (!job?.action_plan) return;
    setFixingDimension(dimension);
    try {
      const actions = job.action_plan
        .filter((a) => a.dimension === dimension)
        .map((a) => a.action);
      
      const res = await supabase.functions.invoke("content-section-rewrite", {
        body: {
          contentItemId,
          sectionHeading: dimensionLabels[dimension]?.label || dimension,
          articleTopic: "SEO optimization fixes",
          instructions: `Apply these SEO improvements to the article content:\n${actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
          mode: "seo-fix",
        },
      });
      if (res.error) throw res.error;
      
      toast({ title: "AI Fix Applied", description: `${dimensionLabels[dimension]?.label} improvements applied` });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
      
      // Re-scan to update scores
      await handleScan();
    } catch (err: any) {
      toast({ title: "Fix failed", description: err.message, variant: "destructive" });
    } finally {
      setFixingDimension(null);
    }
  };

  const handleFixAll = async () => {
    if (!job?.scores) return;
    setFixingAll(true);
    const lowDimensions = Object.entries(job.scores)
      .filter(([_, score]) => score < 75)
      .sort(([, a], [, b]) => a - b)
      .map(([key]) => key);

    if (lowDimensions.length === 0) {
      toast({ title: "All dimensions scoring well!" });
      setFixingAll(false);
      return;
    }

    for (const dim of lowDimensions) {
      await handleFixDimension(dim);
    }
    setFixingAll(false);
    toast({ title: "All fixes applied", description: "Scores have been updated" });
  };

  const hasLowScores = job?.scores && Object.values(job.scores).some((s) => s < 75);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Scan Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">SEO Optimization Score</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {job?.completed_at ? `Last scanned: ${job.completed_at.split("T")[0]}` : "No scans yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleScan} disabled={scanning || fixingAll} className="gap-1.5">
            {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {job ? "Re-scan" : "Run Optimization Scan"}
          </Button>
          {hasLowScores && (
            <Button size="sm" variant="outline" onClick={handleFixAll} disabled={!!fixingDimension || fixingAll || scanning} className="gap-1.5">
              {fixingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              Fix All Low Scores
            </Button>
          )}
        </div>
      </div>

      {!job || job.status === "error" ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {job?.status === "error" ? "Last scan failed. Try again." : "Run an optimization scan to get your SEO score and action plan."}
          </p>
        </div>
      ) : (
        <>
          {/* Score Overview */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={job.overall_score || 0} />
              <div className="flex-1 space-y-3 w-full">
                {job.scores && Object.entries(dimensionLabels).map(([key, { label, weight }]) => {
                  const score = (job.scores as any)?.[key] || 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{weight}</span>
                          <span className={`font-mono font-semibold ${getScoreColor(score)}`}>{score}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getScoreTrackColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Plan */}
          {job.action_plan && job.action_plan.length > 0 && (
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">Action Plan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{job.action_plan.length} prioritized improvements</p>
              </div>
              <div className="divide-y divide-border/50">
                {job.action_plan
                  .sort((a, b) => a.priority - b.priority)
                  .map((action, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                      <span className="shrink-0 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground mt-0.5">
                        {action.priority}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{action.action}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {dimensionLabels[action.dimension]?.label || action.dimension}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${effortColors[action.effort]}`}>
                          {action.effort} effort
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${impactColors[action.impact]}`}>
                          {action.impact} impact
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OptimizationTab;
