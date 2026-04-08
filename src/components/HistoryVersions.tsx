import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  Plus,
  Loader2,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart3,
  Link,
  Eye,
  Maximize2,
  Download,
} from "lucide-react";
import ContentPreview from "@/components/ContentPreview";

interface HistoryVersionsProps {
  contentId: string;
  currentContent: string;
  currentSeoTitle: string;
  currentMetaDescription: string;
  currentSlug: string;
  currentHeroImageUrl?: string;
  currentSchemaTypes?: string[];
  currentSeoScore?: number;
  keyword: string;
  author: string;
  onRestoreVersion: (version: any) => void;
}

interface ContentVersion {
  id: string;
  content_item_id: string;
  user_id: string;
  version_number: number;
  version_label: string | null;
  draft_content: string | null;
  seo_title: string | null;
  meta_description: string | null;
  slug: string | null;
  hero_image_url: string | null;
  schema_types: string[] | null;
  seo_score: number | null;
  aeo_score: number | null;
  optimization_scores: any;
  optimization_action_plan: any;
  aeo_scores: any;
  aeo_recommendations: any;
  internal_links: any;
  external_links: any;
  word_count: number | null;
  notes: string | null;
  created_at: string;
}

const HistoryVersions = ({
  contentId,
  currentContent,
  currentSeoTitle,
  currentMetaDescription,
  currentSlug,
  currentHeroImageUrl,
  currentSchemaTypes,
  currentSeoScore,
  keyword,
  author,
  onRestoreVersion,
}: HistoryVersionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [fullPreviewVersion, setFullPreviewVersion] = useState<ContentVersion | null>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [versionNotes, setVersionNotes] = useState("");

  const fetchVersions = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("content_versions" as any)
      .select("*")
      .eq("content_item_id", contentId)
      .eq("user_id", user.id)
      .order("version_number", { ascending: false });
    setVersions((data as any as ContentVersion[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVersions();
  }, [contentId, user]);

  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const extractLinks = (content: string) => {
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)|href=['"]([^'"]+)['"]/gi;
    const internal: { anchor: string; url: string }[] = [];
    const external: { anchor: string; url: string }[] = [];
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const anchor = match[1] || match[3] || "";
      const url = (match[2] || match[3] || "").trim();
      if (!url) continue;
      const isInternal = url.startsWith("/") || url.startsWith("./") || url.includes("/blog/");
      if (isInternal) {
        internal.push({ anchor, url });
      } else if (url.startsWith("http")) {
        external.push({ anchor, url });
      }
    }
    return { internal, external };
  };

  const fetchCurrentScores = async () => {
    if (!user) return { seoScore: currentSeoScore, aeoScore: null, optScores: null, optPlan: null, aeoScores: null, aeoRecs: null };

    const [optRes, aeoRes] = await Promise.all([
      supabase
        .from("optimization_jobs")
        .select("overall_score, scores, action_plan")
        .eq("content_item_id", contentId)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("aeo_scores")
        .select("overall_score, scores, recommendations")
        .eq("content_item_id", contentId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      seoScore: optRes.data?.overall_score ?? currentSeoScore,
      aeoScore: aeoRes.data?.overall_score ?? null,
      optScores: optRes.data?.scores ?? null,
      optPlan: optRes.data?.action_plan ?? null,
      aeoScores: aeoRes.data?.scores ?? null,
      aeoRecs: aeoRes.data?.recommendations ?? null,
    };
  };

  const handleSaveVersion = async () => {
    if (!user || !currentContent.trim()) return;
    setSaving(true);
    try {
      const nextNumber = versions.length > 0 ? Math.max(...versions.map((v) => v.version_number)) + 1 : 1;
      const links = extractLinks(currentContent);
      const scores = await fetchCurrentScores();

      const { error } = await supabase.from("content_versions" as any).insert({
        content_item_id: contentId,
        user_id: user.id,
        version_number: nextNumber,
        version_label: versionLabel || `Version ${nextNumber}`,
        draft_content: currentContent,
        seo_title: currentSeoTitle,
        meta_description: currentMetaDescription,
        slug: currentSlug,
        hero_image_url: currentHeroImageUrl || null,
        schema_types: currentSchemaTypes || [],
        seo_score: scores.seoScore,
        aeo_score: scores.aeoScore,
        optimization_scores: scores.optScores,
        optimization_action_plan: scores.optPlan,
        aeo_scores: scores.aeoScores,
        aeo_recommendations: scores.aeoRecs,
        internal_links: links.internal,
        external_links: links.external,
        word_count: countWords(currentContent),
        notes: versionNotes || null,
      } as any);

      if (error) throw error;
      toast({ title: "Version saved", description: `Version ${nextNumber} snapshot stored` });
      setVersionLabel("");
      setVersionNotes("");
      fetchVersions();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVersion = async (id: string) => {
    const { error } = await supabase.from("content_versions" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Version deleted" });
      fetchVersions();
    }
  };

  const handleRestore = (version: ContentVersion) => {
    onRestoreVersion({
      draft_content: version.draft_content,
      seo_title: version.seo_title,
      meta_description: version.meta_description,
      slug: version.slug,
    });
    toast({ title: "Version restored", description: `Restored "${version.version_label || `Version ${version.version_number}`}" to editor` });
  };

  const handleDownloadHtml = (version: ContentVersion) => {
    const title = version.seo_title || keyword;
    const meta = version.meta_description || "";
    const heroImg = version.hero_image_url
      ? `<img src="${version.hero_image_url}" alt="${title}" style="max-width:100%;border-radius:8px;margin-bottom:24px;" />`
      : "";
    const bodyContent = (version.draft_content || "")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:16px 0;" />')
      .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>");
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${meta.replace(/"/g, "&quot;")}" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 780px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; line-height: 1.7; }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    h2 { font-size: 1.4rem; margin-top: 32px; }
    h3 { font-size: 1.15rem; margin-top: 24px; }
    img { max-width: 100%; border-radius: 8px; }
    a { color: #2563eb; }
    .meta { color: #6b7280; font-size: 0.85rem; margin-bottom: 24px; }
  </style>
</head>
<body>
  ${heroImg}
  <h1>${title}</h1>
  <p class="meta">By ${author} · ${new Date(version.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
  <p>${bodyContent}</p>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(version.version_label || `version-${version.version_number}`).replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "HTML file saved to your downloads" });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Save current as new version */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Save Current as Version</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Snapshot the current content with all scores, links, and metadata. Use this before making major changes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Version Label</Label>
            <Input
              placeholder={`Version ${versions.length + 1}`}
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes (optional)</Label>
            <Input
              placeholder="What changed in this version?"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <Button onClick={handleSaveVersion} disabled={saving || !currentContent.trim()} size="sm" className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Save Version Snapshot
        </Button>
      </div>

      {/* Version list */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Version History</h3>
            <Badge variant="secondary" className="text-[10px]">{versions.length} versions</Badge>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No versions saved yet. Save your first snapshot above.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {versions.map((v) => {
              const isExpanded = expandedId === v.id;
              const isPreviewing = previewId === v.id;
              return (
                <div key={v.id} className="group">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {v.version_label || `Version ${v.version_number}`}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">v{v.version_number}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(v.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {v.word_count && <span>{v.word_count.toLocaleString()} words</span>}
                      {v.seo_score != null && (
                        <Badge variant={v.seo_score >= 70 ? "default" : "secondary"} className="text-[10px]">
                          SEO {v.seo_score}
                        </Badge>
                      )}
                      {v.aeo_score != null && (
                        <Badge variant={v.aeo_score >= 70 ? "default" : "secondary"} className="text-[10px]">
                          AEO {v.aeo_score}
                        </Badge>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-4 bg-muted/20">
                      {/* Scores overview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-md border border-border bg-card p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">SEO Score</p>
                          <p className="text-lg font-bold text-foreground">{v.seo_score ?? "—"}</p>
                        </div>
                        <div className="rounded-md border border-border bg-card p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">AEO Score</p>
                          <p className="text-lg font-bold text-foreground">{v.aeo_score ?? "—"}</p>
                        </div>
                        <div className="rounded-md border border-border bg-card p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Internal Links</p>
                          <p className="text-lg font-bold text-foreground">{Array.isArray(v.internal_links) ? v.internal_links.length : "—"}</p>
                        </div>
                        <div className="rounded-md border border-border bg-card p-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">External Links</p>
                          <p className="text-lg font-bold text-foreground">{Array.isArray(v.external_links) ? v.external_links.length : "—"}</p>
                        </div>
                      </div>

                      {/* Optimization breakdown */}
                      {v.optimization_scores && typeof v.optimization_scores === "object" && (
                        <div className="rounded-md border border-border bg-card p-3">
                          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5 text-primary" /> Optimization Breakdown
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {Object.entries(v.optimization_scores as Record<string, any>).map(([key, val]) => (
                              <div key={key} className="text-center">
                                <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                                <p className="text-sm font-semibold">{typeof val === "object" ? (val as any)?.score ?? "—" : val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Links detail */}
                      {Array.isArray(v.internal_links) && v.internal_links.length > 0 && (
                        <div className="rounded-md border border-border bg-card p-3">
                          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <Link className="h-3.5 w-3.5 text-primary" /> Internal Links
                          </p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {v.internal_links.map((l: any, i: number) => (
                              <div key={i} className="text-[11px] flex items-center gap-2 text-muted-foreground">
                                <span className="text-foreground font-medium truncate max-w-[200px]">{l.anchor || "—"}</span>
                                <span className="truncate">{l.url}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {v.notes && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">{v.notes}</p>
                      )}

                      {/* Content preview */}
                      {isPreviewing && v.draft_content && (
                        <div className="rounded-md border border-border bg-background p-4 max-h-64 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">{v.draft_content.slice(0, 3000)}{v.draft_content.length > 3000 ? "\n\n... (truncated)" : ""}</pre>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPreviewId(isPreviewing ? null : v.id)} className="h-7 text-xs gap-1.5">
                          <Eye className="h-3 w-3" />
                          {isPreviewing ? "Hide Preview" : "Preview Content"}
                        </Button>
                        <Button size="sm" variant="default" onClick={() => setFullPreviewVersion(v)} className="h-7 text-xs gap-1.5">
                          <Maximize2 className="h-3 w-3" />
                          Full Preview
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRestore(v)} className="h-7 text-xs gap-1.5">
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this version?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{v.version_label || `Version ${v.version_number}`}" will be permanently deleted with all its score data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteVersion(v.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison tip */}
      {versions.length >= 2 && (
        <div className="rounded-lg border border-info/20 bg-info/5 p-4">
          <p className="text-xs text-info">
            <strong>Tip:</strong> Compare SEO/AEO scores and link counts across versions to identify which variation performs best. Restore the winning version and continue optimising from there.
          </p>
        </div>
      )}

      {/* Full Preview Dialog */}
      <Dialog open={!!fullPreviewVersion} onOpenChange={(open) => !open && setFullPreviewVersion(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              {fullPreviewVersion?.version_label || `Version ${fullPreviewVersion?.version_number}`}
              {fullPreviewVersion?.seo_score != null && (
                <Badge variant={fullPreviewVersion.seo_score >= 70 ? "default" : "secondary"} className="text-[10px]">
                  SEO {fullPreviewVersion.seo_score}
                </Badge>
              )}
              {fullPreviewVersion?.aeo_score != null && (
                <Badge variant={fullPreviewVersion.aeo_score >= 70 ? "default" : "secondary"} className="text-[10px]">
                  AEO {fullPreviewVersion.aeo_score}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {fullPreviewVersion && (
            <div className="px-4 pb-6">
              <ContentPreview
                title={fullPreviewVersion.seo_title || keyword}
                seoTitle={fullPreviewVersion.seo_title || ""}
                metaDescription={fullPreviewVersion.meta_description || ""}
                author={author}
                keyword={keyword}
                heroImageUrl={fullPreviewVersion.hero_image_url}
                draftContent={fullPreviewVersion.draft_content || ""}
                updatedAt={fullPreviewVersion.created_at}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryVersions;
