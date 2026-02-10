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
} from "lucide-react";

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

  // Local editable state
  const [item, setItem] = useState<any>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [fetched, setFetched] = useState(false);

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

  const handleApprove = () => handleStageChange("published");
  const handleReject = () => handleStageChange("discovery");

  const currentStageIndex = item ? stages.indexOf(item.status) : -1;
  const canAdvance = currentStageIndex >= 0 && currentStageIndex < stages.length - 1;
  const nextStage = canAdvance ? stages[currentStageIndex + 1] : null;

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
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save
          </Button>
          {item.status !== "published" && (
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={saving}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
          )}
          {item.status === "optimizing" && (
            <Button size="sm" onClick={handleApprove} disabled={saving}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Approve & Publish
            </Button>
          )}
          {canAdvance && item.status !== "optimizing" && nextStage && (
            <Button size="sm" onClick={() => handleStageChange(nextStage)} disabled={saving}>
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
          <div className="border-b border-border px-5 py-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Content Draft</h2>
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
    </div>
  );
};

export default ContentDetail;
