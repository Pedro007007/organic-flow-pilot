import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  FileText,
  ExternalLink,
  Save,
  Sparkles,
  Send,
  Wand2,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ContentPerformanceChart from "@/components/ContentPerformanceChart";

interface ContentDetailProps {
  contentId: string;
  onBack: () => void;
}

const stages = ["discovery", "strategy", "writing", "optimizing", "published", "monitoring"] as const;

const stageConfig: Record<string, { label: string; color: string }> = {
  discovery: { label: "Discovery", color: "text-info" },
  strategy: { label: "Strategy", color: "text-warning" },
  writing: { label: "Writing", color: "text-primary" },
  optimizing: { label: "Optimizing", color: "text-warning" },
  published: { label: "Published", color: "text-success" },
  monitoring: { label: "Monitoring", color: "text-success" },
};

const ContentDetail = ({ contentId, onBack }: ContentDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Local editable state
  const [item, setItem] = useState<any>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [fetched, setFetched] = useState(false);
  const [rewriting, setRewriting] = useState<string | false>(false);

  // Fetch on mount
  if (!fetched) {
    setFetched(true);
    setLoading(true);
    supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .maybeSingle()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          toast({ title: "Content not found", variant: "destructive" });
          onBack();
          return;
        }
        setItem(data);
        setSeoTitle(data.seo_title || "");
        setMetaDescription(data.meta_description || "");
        setSlug(data.slug || "");
        setDraftContent(data.draft_content || "");
      });
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("content_items")
      .update({
        seo_title: seoTitle,
        meta_description: metaDescription,
        slug,
        draft_content: draftContent,
      })
      .eq("id", contentId);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved" });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    }
  };

  const handleStageChange = async (newStatus: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("content_items")
      .update({ status: newStatus })
      .eq("id", contentId);

    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setItem((prev: any) => ({ ...prev, status: newStatus }));
      toast({ title: `Moved to ${stageConfig[newStatus]?.label || newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    }
  };

  const handleApprove = () => handlePublish();
  const handleReject = () => handleStageChange("discovery");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await supabase.functions.invoke("content-generate", {
        body: { contentItemId: item.id, keyword: item.keyword, title: item.title },
      });
      if (res.error) throw res.error;
      const content = res.data?.content || "";
      setDraftContent(content);
      setItem((prev: any) => ({ ...prev, status: "writing" }));
      toast({ title: "Content generated", description: `${content.length} characters written` });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await supabase.functions.invoke("seo-optimize", {
        body: { contentItemId: item.id },
      });
      if (res.error) throw res.error;
      const d = res.data;
      if (d.seo_title) setSeoTitle(d.seo_title);
      if (d.meta_description) setMetaDescription(d.meta_description);
      if (d.slug) setSlug(d.slug);
      setItem((prev: any) => ({ ...prev, status: "optimizing" }));
      toast({ title: "SEO optimized", description: "Meta tags and slug updated" });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    } catch (err: any) {
      toast({ title: "Optimization failed", description: err.message, variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await supabase.functions.invoke("publish-webhook", {
        body: { contentItemId: item.id },
      });
      if (res.error) throw res.error;
      setItem((prev: any) => ({ ...prev, status: "published", url: res.data?.url }));
      toast({ title: "Published!", description: res.data?.url });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    } catch (err: any) {
      toast({ title: "Publish failed", description: err.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const handleRewrite = async (action: "rewrite" | "expand" | "shorten") => {
    if (!draftContent.trim()) return;
    setRewriting(action);
    try {
      const res = await supabase.functions.invoke("content-rewrite", {
        body: { text: draftContent, action },
      });
      if (res.error) throw res.error;
      if (res.data?.result) {
        setDraftContent(res.data.result);
        toast({ title: `Content ${action}${action === "rewrite" ? "ten" : action === "expand" ? "ed" : "ed"}` });
      }
    } catch (err: any) {
      toast({ title: "AI rewrite failed", description: err.message, variant: "destructive" });
    } finally {
      setRewriting(false);
    }
  };

  const currentStageIndex = item ? stages.indexOf(item.status) : -1;
  const canAdvance = currentStageIndex >= 0 && currentStageIndex < stages.length - 1;
  const nextStage = canAdvance ? stages[currentStageIndex + 1] : null;
  const isBusy = saving || generating || optimizing || publishing;

  if (loading || !item) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to pipeline
        </button>
        <div className="flex items-center gap-2">
          {/* AI Actions */}
          {(item.status === "discovery" || item.status === "strategy") && (
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isBusy} className="border-primary/30 text-primary hover:bg-primary/10">
              {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              Generate Content
            </Button>
          )}
          {item.status === "writing" && (
            <Button size="sm" variant="outline" onClick={handleOptimize} disabled={isBusy} className="border-accent/30 text-accent hover:bg-accent/10">
              {optimizing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
              Optimize SEO
            </Button>
          )}
          {item.status === "optimizing" && (
            <Button size="sm" onClick={handlePublish} disabled={isBusy} className="bg-success hover:bg-success/90 text-success-foreground">
              {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Publish
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={handleSave} disabled={isBusy}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save
          </Button>
          {item.status !== "published" && (
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={isBusy}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
          )}
          {canAdvance && item.status !== "optimizing" && nextStage && (
            <Button size="sm" onClick={() => handleStageChange(nextStage)} disabled={isBusy}>
              <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
              Move to {stageConfig[nextStage]?.label}
            </Button>
          )}
        </div>
      </div>

      {/* Stage progress */}
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const isActive = item.status === stage;
          const isPast = stages.indexOf(item.status) > i;
          return (
            <div key={stage} className="flex items-center gap-1">
              <button
                onClick={() => handleStageChange(stage)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : isPast
                    ? "bg-success/15 text-success border border-success/20"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {stageConfig[stage].label}
              </button>
              {i < stages.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
            </div>
          );
        })}
      </div>

      {/* Content + Metadata grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Draft preview */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Content Draft</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRewrite("rewrite")}
                disabled={!!rewriting || !draftContent.trim()}
                className="h-7 px-2.5 text-xs"
              >
                {rewriting === "rewrite" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                Rewrite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRewrite("expand")}
                disabled={!!rewriting || !draftContent.trim()}
                className="h-7 px-2.5 text-xs"
              >
                {rewriting === "expand" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Maximize2 className="mr-1 h-3 w-3" />}
                Expand
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRewrite("shorten")}
                disabled={!!rewriting || !draftContent.trim()}
                className="h-7 px-2.5 text-xs"
              >
                {rewriting === "shorten" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Minimize2 className="mr-1 h-3 w-3" />}
                Shorten
              </Button>
            </div>
          </div>
          <div className="p-5">
            <Textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Draft content will appear here after the Content Generation agent runs..."
              className="min-h-[400px] bg-background border-border font-mono text-sm leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">SEO Metadata</h3>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">SEO Title</Label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Meta title (≤60 chars)"
                maxLength={60}
                className="bg-background border-border text-sm"
              />
              <p className="text-[10px] text-muted-foreground text-right">{seoTitle.length}/60</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Meta Description</Label>
              <Textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Meta description (≤155 chars)"
                maxLength={155}
                className="bg-background border-border text-sm min-h-[80px]"
              />
              <p className="text-[10px] text-muted-foreground text-right">{metaDescription.length}/155</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">URL Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-slug"
                maxLength={100}
                className="bg-background border-border text-sm font-mono"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Keyword</span>
                <span className="font-mono text-foreground">{item.keyword}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Author</span>
                <span className="text-foreground">{item.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schema</span>
                <span className="text-foreground">{(item.schema_types || []).join(", ") || "—"}</span>
              </div>
              {item.url && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">URL</span>
                  <span className="font-mono text-primary flex items-center gap-1">
                    {item.url} <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              )}
              {item.position && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rank</span>
                  <span className="font-mono text-foreground">#{Number(item.position)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-foreground">{item.updated_at?.split("T")[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {(item.status === "published" || item.status === "monitoring") && (
        <ContentPerformanceChart contentId={contentId} keyword={item.keyword} />
      )}
    </div>
  );
};

export default ContentDetail;
