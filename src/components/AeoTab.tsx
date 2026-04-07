import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Sparkles, AlertTriangle, CheckCircle2, Wrench, Zap, Shield, TrendingUp } from "lucide-react";

interface AeoTabProps {
  contentId: string;
  hasContent: boolean;
  onContentUpdated?: () => void;
}

interface AeoScore {
  overall_score: number;
  scores: Record<string, number>;
  recommendations: Array<{
    dimension: string;
    issue: string;
    fix: string;
    priority: string;
  }>;
}

const THRESHOLD = 80;

const dimensions = [
  { key: "faq_coverage", label: "FAQ Coverage", weight: "25%", icon: "❓" },
  { key: "answer_blocks", label: "Answer Blocks", weight: "20%", icon: "📝" },
  { key: "entity_clarity", label: "Entity Clarity", weight: "20%", icon: "🎯" },
  { key: "schema_richness", label: "Schema Richness", weight: "20%", icon: "🏗️" },
  { key: "conciseness", label: "Conciseness", weight: "15%", icon: "✂️" },
];

const priorityColors: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-info/15 text-info border-info/30",
};

const scoreColor = (val: number) => {
  if (val >= 80) return "text-success";
  if (val >= 50) return "text-warning";
  return "text-destructive";
};

const scoreGlow = (val: number) => {
  if (val >= 80) return "shadow-[0_0_20px_hsl(152_70%_50%/0.15)]";
  if (val >= 50) return "shadow-[0_0_20px_hsl(38_92%_60%/0.15)]";
  return "shadow-[0_0_20px_hsl(0_72%_55%/0.15)]";
};

const AeoTab = ({ contentId, hasContent, onContentUpdated }: AeoTabProps) => {
  const { toast } = useToast();
  const [scoring, setScoring] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [fixingDim, setFixingDim] = useState<string | null>(null);
  const [score, setScore] = useState<AeoScore | null>(null);
  const [fetched, setFetched] = useState(false);

  if (!fetched) {
    setFetched(true);
    supabase
      .from("aeo_scores")
      .select("*")
      .eq("content_item_id", contentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setScore({
            overall_score: data.overall_score ?? 0,
            scores: (data.scores as any) || {},
            recommendations: (data.recommendations as any) || [],
          });
        }
      });
  }

  const handleScore = async () => {
    setScoring(true);
    try {
      const res = await supabase.functions.invoke("aeo-score", { body: { contentItemId: contentId } });
      if (res.error) {
        const errBody = res.error?.context ? await (res.error.context as any).json?.() : null;
        throw new Error(errBody?.error || res.error.message || "Scoring failed");
      }
      setScore(res.data);
      toast({ title: "AEO Score calculated", description: `Overall: ${res.data.overall_score}/100` });
      onContentUpdated?.();
    } catch (err: any) {
      toast({ title: "AEO scoring failed", description: err.message, variant: "destructive" });
    } finally {
      setScoring(false);
    }
  };

  const handleGenerateBlocks = async () => {
    setGenerating(true);
    try {
      const res = await supabase.functions.invoke("generate-answer-blocks", { body: { contentItemId: contentId } });
      if (res.error) {
        const errBody = res.error?.context ? await (res.error.context as any).json?.() : null;
        throw new Error(errBody?.error || res.error.message || "Generation failed");
      }
      toast({ title: "Answer blocks generated", description: "TL;DR, Key Takeaways, and FAQs appended to content" });
      onContentUpdated?.();
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleFixDimension = async (dimension: string, label: string, skipRescore = false) => {
    setFixingDim(dimension);
    try {
      const res = await supabase.functions.invoke("aeo-fix", {
        body: { contentItemId: contentId, dimension },
      });
      if (res.error) {
        const errBody = res.error?.context ? await (res.error.context as any).json?.() : null;
        throw new Error(errBody?.error || res.error.message || "Fix failed");
      }
      toast({ title: `${label} improved`, description: "Content updated." });
      onContentUpdated?.();
      if (!skipRescore) {
        setFixingDim(null);
        await handleScore();
        return;
      }
    } catch (err: any) {
      toast({ title: `${label} fix failed`, description: err.message, variant: "destructive" });
    } finally {
      setFixingDim(null);
    }
  };

  const handleFixAll = async () => {
    if (!score) return;
    const lowDims = dimensions.filter((d) => (score.scores[d.key] || 0) < THRESHOLD);
    if (lowDims.length === 0) {
      toast({ title: "All dimensions above threshold", description: "Nothing to fix!" });
      return;
    }
    for (const dim of lowDims) {
      await handleFixDimension(dim.key, dim.label, true);
    }
    toast({ title: "All fixes applied", description: "Re-scoring automatically…" });
    await handleScore();
  };

  const lowCount = score ? dimensions.filter((d) => (score.scores[d.key] || 0) < THRESHOLD).length : 0;
  const isBusy = scoring || generating || !!fixingDim;

  if (!hasContent) {
    return (
      <div className="relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-10 text-center shadow-lg">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-4 drop-shadow-lg" />
        <p className="text-sm text-muted-foreground font-medium">Generate content first to run AEO analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions — frosted glass toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl p-3 shadow-sm">
        <Button onClick={handleScore} disabled={isBusy} size="sm" className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          {scoring ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Brain className="mr-1.5 h-3.5 w-3.5" />}
          {score ? "Re-score AEO" : "Run AEO Score"}
        </Button>
        <Button onClick={handleGenerateBlocks} disabled={isBusy} size="sm" variant="outline" className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-border/50 bg-card/50 backdrop-blur-sm">
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          Generate Answer Blocks
        </Button>
        {score && lowCount > 0 && (
          <Button onClick={handleFixAll} disabled={isBusy} size="sm" variant="secondary" className="ml-auto shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20">
            {fixingDim ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
            Fix All Below {THRESHOLD} ({lowCount})
          </Button>
        )}
      </div>

      {score && (
        <>
          {/* Overall score — premium glass card */}
          <div className={`relative overflow-hidden rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xl p-6 shadow-lg transition-all duration-500 hover:shadow-xl hover:-translate-y-0.5 ${scoreGlow(score.overall_score)}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 backdrop-blur-sm">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">AEO Score</h3>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${scoreColor(score.overall_score)}`} />
                  <span className={`text-4xl font-bold font-mono tracking-tighter ${scoreColor(score.overall_score)} drop-shadow-sm`}>
                    {score.overall_score}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">/100</span>
                </div>
              </div>
              <Progress value={score.overall_score} className="h-2.5 rounded-full" />
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {score.overall_score >= 80 ? "Excellent — content is well-optimized for AI extraction." :
                  score.overall_score >= 50 ? "Good — some improvements recommended for better AI visibility." :
                    "Needs work — significant improvements needed for AI search readiness."}
              </p>
            </div>
          </div>

          {/* Dimension breakdown — floating glass cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {dimensions.map((dim, i) => {
              const val = score.scores[dim.key] || 0;
              const belowThreshold = val < THRESHOLD;
              const isFixing = fixingDim === dim.key;
              return (
                <div
                  key={dim.key}
                  className={`
                    group relative overflow-hidden rounded-xl border backdrop-blur-xl p-5
                    transition-all duration-500 ease-out
                    hover:-translate-y-1.5 hover:shadow-xl
                    animate-slide-in
                    ${belowThreshold
                      ? "border-warning/30 bg-warning/5 shadow-[0_4px_20px_hsl(38_92%_60%/0.08)]"
                      : "border-border/40 bg-card/30 shadow-md"
                    }
                  `}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Glass highlight */}
                  <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg drop-shadow-sm">{dim.icon}</span>
                      <span className={`text-2xl font-bold font-mono tracking-tight ${scoreColor(val)} drop-shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                        {val}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground tracking-wide">{dim.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{dim.weight} weight</p>
                    <div className="mt-3 relative">
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            val >= 80 ? "bg-success" : val >= 50 ? "bg-warning" : "bg-destructive"
                          }`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                    {belowThreshold && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full mt-3.5 h-8 text-[11px] font-semibold text-warning hover:text-warning-foreground hover:bg-warning/20 gap-1.5 rounded-lg border border-warning/20 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                        disabled={isBusy}
                        onClick={() => handleFixDimension(dim.key, dim.label)}
                      >
                        {isFixing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wrench className="h-3 w-3" />
                        )}
                        {isFixing ? "Fixing…" : "AI Fix"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations — frosted glass list */}
          {score.recommendations?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground tracking-wide uppercase flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-primary" />
                Recommendations
              </h3>
              <div className="space-y-2.5">
                {score.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-slide-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-foreground/[0.01] via-transparent to-transparent pointer-events-none" />
                    <div className="relative z-10 flex items-start gap-3">
                      {rec.priority === "high" ? (
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-destructive/10 shrink-0 mt-0.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/50 shrink-0 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground">{rec.issue}</span>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${priorityColors[rec.priority] || ""}`}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-medium bg-card/50 backdrop-blur-sm">{rec.dimension}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{rec.fix}</p>
                      </div>
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

export default AeoTab;
