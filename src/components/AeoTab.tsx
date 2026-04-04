import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Sparkles, AlertTriangle, CheckCircle2, Wrench, Zap } from "lucide-react";

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
      // Auto re-score after individual fix unless called from fixAll
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
      <Card className="p-8 text-center">
        <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Generate content first to run AEO analysis.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={handleScore} disabled={isBusy} size="sm">
          {scoring ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Brain className="mr-1.5 h-3.5 w-3.5" />}
          {score ? "Re-score AEO" : "Run AEO Score"}
        </Button>
        <Button onClick={handleGenerateBlocks} disabled={isBusy} size="sm" variant="outline">
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          Generate Answer Blocks
        </Button>
        {score && lowCount > 0 && (
          <Button onClick={handleFixAll} disabled={isBusy} size="sm" variant="secondary" className="ml-auto">
            {fixingDim ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
            Fix All Below {THRESHOLD} ({lowCount})
          </Button>
        )}
      </div>

      {score && (
        <>
          {/* Overall score */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">AEO Score</h3>
              <span className={`text-3xl font-bold ${scoreColor(score.overall_score)}`}>
                {score.overall_score}
              </span>
            </div>
            <Progress value={score.overall_score} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {score.overall_score >= 80 ? "Excellent — content is well-optimized for AI extraction." :
                score.overall_score >= 50 ? "Good — some improvements recommended for better AI visibility." :
                  "Needs work — significant improvements needed for AI search readiness."}
            </p>
          </Card>

          {/* Dimension breakdown with fix buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {dimensions.map((dim) => {
              const val = score.scores[dim.key] || 0;
              const belowThreshold = val < THRESHOLD;
              const isFixing = fixingDim === dim.key;
              return (
                <Card key={dim.key} className={`p-4 relative ${belowThreshold ? "border-warning/40" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{dim.icon}</span>
                    <span className={`text-lg font-bold ${scoreColor(val)}`}>{val}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{dim.label}</p>
                  <p className="text-[10px] text-muted-foreground">{dim.weight} weight</p>
                  <Progress value={val} className="h-1 mt-2" />
                  {belowThreshold && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full mt-3 h-7 text-[11px] text-warning hover:text-warning hover:bg-warning/10 gap-1.5"
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
                </Card>
              );
            })}
          </div>

          {/* Recommendations */}
          {score.recommendations?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Recommendations</h3>
              <div className="space-y-2">
                {score.recommendations.map((rec, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      {rec.priority === "high" ? (
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{rec.issue}</span>
                          <Badge variant="outline" className={`text-[10px] ${priorityColors[rec.priority] || ""}`}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{rec.dimension}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.fix}</p>
                      </div>
                    </div>
                  </Card>
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
