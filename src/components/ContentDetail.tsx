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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  ImageIcon,
  Search,
  PenLine,
  Download,
  Link,
  EyeOff,
  Trash2,
  MessageSquarePlus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ContentPerformanceChart from "@/components/ContentPerformanceChart";
import ContentPreview from "@/components/ContentPreview";
import FulfilmentDashboard from "@/components/FulfilmentDashboard";
import OptimizationTab from "@/components/OptimizationTab";
import RepurposeTab from "@/components/RepurposeTab";
import AeoTab from "@/components/AeoTab";
import ContentDetailGuide from "@/components/ContentDetailGuide";
import HistoryVersions from "@/components/HistoryVersions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentDetailProps {
  contentId: string;
  onBack: () => void;
}

const stages = ["discovery", "strategy", "writing", "optimizing", "unpublished", "published", "monitoring"] as const;

const stageConfig: Record<string, { label: string; color: string }> = {
  discovery: { label: "Discovery", color: "text-info" },
  strategy: { label: "Strategy", color: "text-warning" },
  writing: { label: "Writing", color: "text-primary" },
  optimizing: { label: "Optimizing", color: "text-warning" },
  unpublished: { label: "Unpublished", color: "text-muted-foreground" },
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
  const [generatingImage, setGeneratingImage] = useState(false);
  const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null);
  const [researchingSERP, setResearchingSERP] = useState(false);
  const [upgradingLinks, setUpgradingLinks] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingFaqs, setGeneratingFaqs] = useState(false);
  const [faqCount, setFaqCount] = useState(7);
  const [linkCount, setLinkCount] = useState(8);
  const [targetSections, setTargetSections] = useState<string[]>([]);

  // Local editable state
  const [item, setItem] = useState<any>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [fetched, setFetched] = useState(false);
  const [rewriting, setRewriting] = useState<string | false>(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");
  const [sectionRewriting, setSectionRewriting] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [imagePromptDescription, setImagePromptDescription] = useState("");
  const [bodyImagePrompts, setBodyImagePrompts] = useState<Record<number, string>>({});
  const IMAGE_MODEL_FALLBACK = "google/gemini-3.1-flash-image-preview";
  const [heroAspectRatio, setHeroAspectRatio] = useState("16:9");
  const [heroStyle, setHeroStyle] = useState("_default");
  const [heroModel, setHeroModel] = useState(IMAGE_MODEL_FALLBACK);
  const [bodyImageSettings, setBodyImageSettings] = useState<Record<number, { aspectRatio: string; style: string; model: string }>>({});

  const styleOptions = [
    { value: "_default", label: "Default (Brand)" },
    { value: "modern editorial", label: "Modern Editorial" },
    { value: "cinematic", label: "Cinematic" },
    { value: "flat illustration", label: "Flat Illustration" },
    { value: "3d render", label: "3D Render" },
    { value: "watercolor", label: "Watercolor" },
    { value: "photorealistic", label: "Photorealistic" },
    { value: "ultrarealistic", label: "Ultra Realistic" },
    { value: "minimalist", label: "Minimalist" },
    { value: "abstract", label: "Abstract" },
  ];

  const modelOptions = [
    { value: "google/gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image (Fast)" },
    { value: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro Image (HQ)" },
    { value: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
  ];

  const validImageModels = new Set(modelOptions.map((option) => option.value));
  const sanitizeImageModel = (value?: string) =>
    value && validImageModels.has(value) ? value : IMAGE_MODEL_FALLBACK;

  const aspectRatios = ["16:9", "4:3", "4:2", "3:2", "1:1", "4:5", "9:16"];

  const getBodySettings = (i: number) => {
    const current = bodyImageSettings[i];
    return {
      aspectRatio: current?.aspectRatio || "16:9",
      style: current?.style || "_default",
      model: sanitizeImageModel(current?.model),
    };
  };
  const updateBodySettings = (i: number, patch: Partial<{ aspectRatio: string; style: string; model: string }>) => {
    setBodyImageSettings((prev) => ({ ...prev, [i]: { ...getBodySettings(i), ...patch } }));
  };
  

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
          setItem(null);
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
        body: {
          contentItemId: item.id,
          keyword: item.keyword,
          title: item.title,
          serpResearch: item.serp_research || undefined,
          brandId: item.brand_id || undefined,
          context: item.context || undefined,
          referenceLinks: item.reference_links || undefined,
          extraKeywords: item.extra_keywords || undefined,
        },
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
      const seo = d.seo || d;
      if (seo.meta_title) setSeoTitle(seo.meta_title);
      if (seo.meta_description) setMetaDescription(seo.meta_description);
      if (seo.slug) setSlug(seo.slug);
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
        body: { text: draftContent, action, brandId: item.brand_id },
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

  const handleSectionRewrite = async () => {
    if (!selectedText.trim() || !selectionRange) return;
    setSectionRewriting(true);
    try {
      const res = await supabase.functions.invoke("content-section-rewrite", {
        body: {
          sectionContent: selectedText,
          sectionHeading: "",
          articleTopic: item.title,
          targetKeyword: item.keyword,
          searchIntent: "informational",
          funnelStage: "middle of funnel",
          brandId: item.brand_id,
        },
      });
      if (res.error) throw res.error;
      if (res.data?.result) {
        const before = draftContent.slice(0, selectionRange.start);
        const after = draftContent.slice(selectionRange.end);
        setDraftContent(before + res.data.result + after);
        setSelectedText("");
        setSelectionRange(null);
        toast({ title: "Section rewritten" });
      }
    } catch (err: any) {
      toast({ title: "Section rewrite failed", description: err.message, variant: "destructive" });
    } finally {
      setSectionRewriting(false);
    }
  };

  const handleTextSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== end) {
      setSelectedText(target.value.slice(start, end));
      setSelectionRange({ start, end });
    } else {
      setSelectedText("");
      setSelectionRange(null);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileBaseName = slug || item?.title?.toLowerCase().replace(/\s+/g, "-") || "content";

  const exportMarkdown = () => {
    downloadBlob(new Blob([draftContent], { type: "text/markdown" }), `${fileBaseName}.md`);
  };

  const buildHtmlDoc = () => {
    const displayTitle = seoTitle || item?.title || "";
    const jsonLd = item?.structured_data ? `<script type="application/ld+json">${JSON.stringify(item.structured_data)}</script>` : "";
    // Simple markdown→HTML conversion for export
    let body = draftContent
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;"/>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br/>");
    body = `<p>${body}</p>`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${displayTitle}</title>
${metaDescription ? `<meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}"/>` : ""}
${jsonLd}
</head>
<body>
${item?.hero_image_url ? `<img src="${item.hero_image_url}" alt="${displayTitle.replace(/"/g, '&quot;')}" style="max-width:100%;"/>` : ""}
<h1>${displayTitle}</h1>
${body}
</body>
</html>`;
  };

  const exportHtml = () => {
    downloadBlob(new Blob([buildHtmlDoc()], { type: "text/html" }), `${fileBaseName}.html`);
  };

  const exportDocx = () => {
    downloadBlob(new Blob([buildHtmlDoc()], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), `${fileBaseName}.docx`);
  };

  const exportPlainText = () => {
    const plain = draftContent
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/^[-*+]\s/gm, "• ")
      .replace(/^>\s?/gm, "");
    downloadBlob(new Blob([plain], { type: "text/plain" }), `${fileBaseName}.txt`);
  };

  const isBusy = saving || generating || optimizing || publishing || generatingImage || researchingSERP || sectionRewriting || regeneratingImageIndex !== null || upgradingLinks || unpublishing || deleting || generatingFaqs;

  const handleUnpublish = async () => {
    setUnpublishing(true);
    try {
      const { error } = await supabase
        .from("content_items")
        .update({ status: "unpublished", url: null })
        .eq("id", contentId);
      if (error) throw error;
      setItem((prev: any) => ({ ...prev, status: "unpublished", url: null }));
      toast({ title: "Unpublished", description: "Article removed from the public blog and marked as Unpublished." });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    } catch (err: any) {
      toast({ title: "Unpublish failed", description: err.message, variant: "destructive" });
    } finally {
      setUnpublishing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("content_items").delete().eq("id", contentId);
      if (error) throw error;
      toast({ title: "Deleted", description: "Content permanently removed." });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
      onBack();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
      setDeleting(false);
    }
  };

  const handleSERPResearch = async () => {
    setResearchingSERP(true);
    try {
      const res = await supabase.functions.invoke("serp-research", {
        body: { contentItemId: item.id, keyword: item.keyword, limit: 10 },
      });
      if (res.error) throw res.error;
      setItem((prev: any) => ({ ...prev, serp_research: res.data?.analysis }));
      toast({ title: "SERP research complete", description: `Analysed ${res.data?.analysis?.raw_competitors?.length || 0} competitors` });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    } catch (err: any) {
      toast({ title: "SERP research failed", description: err.message, variant: "destructive" });
    } finally {
      setResearchingSERP(false);
    }
  };

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const res = await supabase.functions.invoke("generate-hero-image", {
        body: { contentItemId: item.id, keyword: item.keyword, title: item.title, customPrompt: imagePromptDescription || undefined, aspectRatio: heroAspectRatio, style: heroStyle === "_default" ? undefined : heroStyle, model: heroModel },
      });
      if (res.error) throw res.error;
      const queued = res.data?.queued === true;
      const newUrl = res.data?.hero_image_url;
      if (newUrl) {
        setItem((prev: any) => ({ ...prev, hero_image_url: `${newUrl}?t=${Date.now()}` }));
      }
      toast({
        title: queued ? "Image queued" : "Hero image generated",
        description: queued ? (res.data?.message || "Rate limited — retry in about a minute.") : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    } catch (err: any) {
      toast({ title: "Image generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  // Extract body images from markdown
  const bodyImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const bodyImages: { alt: string; url: string; fullMatch: string; index: number }[] = [];
  let match: RegExpExecArray | null;
  let imgIdx = 0;
  while ((match = bodyImageRegex.exec(draftContent)) !== null) {
    bodyImages.push({ alt: match[1], url: match[2], fullMatch: match[0], index: imgIdx++ });
  }

  // Build fixed 2-slot body images array
  const displayBodyImages: { alt: string; url: string; fullMatch: string; exists: boolean }[] = Array.from({ length: 2 }, (_, i) => {
    const existing = bodyImages[i];
    return existing
      ? { alt: existing.alt, url: existing.url, fullMatch: existing.fullMatch, exists: true }
      : { alt: "", url: "", fullMatch: "", exists: false };
  });

  const handleRegenerateBodyImage = async (slotIndex: number, oldMatch: string | null) => {
    setRegeneratingImageIndex(slotIndex);
    try {
      const prompt = bodyImagePrompts[slotIndex] || undefined;
      const bs = getBodySettings(slotIndex);
      const res = await supabase.functions.invoke("generate-hero-image", {
        body: { contentItemId: item.id, keyword: item.keyword, title: item.title, customPrompt: prompt, imageType: "body", aspectRatio: bs.aspectRatio, style: bs.style === "_default" ? undefined : bs.style, model: bs.model },
      });
      if (res.error) throw res.error;

      const queued = res.data?.queued === true;
      const newUrl = res.data?.image_url;
      if (queued && !newUrl) {
        toast({ title: "Image queued", description: res.data?.message || "Rate limited — retry in about a minute." });
        return;
      }

      if (newUrl) {
        const altText = item.keyword;
        const newMarkdown = `![${altText}](${newUrl})`;
        let newContent: string;

        if (oldMatch) {
          newContent = draftContent.replace(oldMatch, newMarkdown);
        } else {
          const lines = draftContent.split("\n");
          const insertPoint = Math.min(Math.floor(lines.length * ((slotIndex + 1) / 3)), lines.length);
          lines.splice(insertPoint, 0, "", newMarkdown, "");
          newContent = lines.join("\n");
        }

        setDraftContent(newContent);

        // Auto-save to database
        const { error: saveError } = await supabase.from("content_items").update({ draft_content: newContent }).eq("id", item.id);
        if (saveError) {
          console.error("Failed to auto-save body image:", saveError);
          toast({ title: `Body image ${slotIndex + 1} ${oldMatch ? "regenerated" : "generated"}`, description: "Warning: image not saved to database", variant: "destructive" });
        } else {
          toast({ title: `Body image ${slotIndex + 1} ${oldMatch ? "regenerated" : "generated"} & saved` });
        }
      }
    } catch (err: any) {
      toast({ title: "Image generation failed", description: err.message, variant: "destructive" });
    } finally {
      setRegeneratingImageIndex(null);
    }
  };

  const handleUpgradeLinks = async () => {
    if (!item || !draftContent) return;
    setUpgradingLinks(true);
    try {
      const { data, error } = await supabase.functions.invoke("upgrade-internal-links", {
        body: {
          contentItemId: item.id,
          draftContent,
          maxLinks: linkCount,
          targetSections: targetSections.length > 0 ? targetSections : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.content) {
        setDraftContent(data.content);
        toast({ title: "Internal links upgraded", description: `Up to ${linkCount} internal links added.` });
        queryClient.invalidateQueries({ queryKey: ["content_items"] });
      }
    } catch (err: any) {
      toast({ title: "Link upgrade failed", description: err.message, variant: "destructive" });
    } finally {
      setUpgradingLinks(false);
    }
  };

  const handleGenerateFaqs = async () => {
    if (!item || !draftContent) return;
    setGeneratingFaqs(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-faqs", {
        body: { contentItemId: item.id, faqCount },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.success) {
        // Re-fetch updated content
        const { data: updated } = await supabase.from("content_items").select("draft_content").eq("id", item.id).maybeSingle();
        if (updated?.draft_content) {
          setDraftContent(updated.draft_content);
        }
        toast({ title: "FAQs generated", description: `${data.count} FAQ pairs added to the article.` });
        queryClient.invalidateQueries({ queryKey: ["content_items"] });
      }
    } catch (err: any) {
      toast({ title: "FAQ generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingFaqs(false);
    }
  };

  // Extract H2 headings from draft content for section targeting
  const extractHeadings = (content: string): string[] => {
    const headingRegex = /^##\s+(.+)$/gm;
    const headings: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = headingRegex.exec(content)) !== null) {
      headings.push(m[1].trim());
    }
    return headings;
  };
  const articleHeadings = extractHeadings(draftContent);

  const currentStageIndex = item ? stages.indexOf(item.status) : -1;
  const canAdvance = currentStageIndex >= 0 && currentStageIndex < stages.length - 1;
  const nextStage = canAdvance ? stages[currentStageIndex + 1] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-muted-foreground">Content not found. It may have been deleted.</p>
        <button onClick={onBack} className="text-sm text-primary hover:underline">← Back to pipeline</button>
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
            <>
              <Button size="sm" variant="outline" onClick={handleSERPResearch} disabled={isBusy} className="border-info/30 text-info hover:bg-info/10">
                {researchingSERP ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Search className="mr-1.5 h-3.5 w-3.5" />}
                SERP Research
              </Button>
              <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isBusy} className="border-primary/30 text-primary hover:bg-primary/10">
                {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                Generate Content
              </Button>
            </>
          )}
          {draftContent && (
            <>
              {/* Upgrade Links with settings popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isBusy} className="border-primary/30 text-primary hover:bg-primary/10">
                    {upgradingLinks ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Link className="mr-1.5 h-3.5 w-3.5" />}
                    Upgrade Links ({linkCount})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 space-y-3" align="end">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Max Links</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={3}
                        max={20}
                        value={linkCount}
                        onChange={(e) => setLinkCount(Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-sm font-mono w-6 text-center">{linkCount}</span>
                    </div>
                  </div>
                  {articleHeadings.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Target Sections</Label>
                      <p className="text-[10px] text-muted-foreground">Prioritise links in these sections (optional)</p>
                      <div className="max-h-32 overflow-y-auto space-y-1.5">
                        {articleHeadings.map((heading) => (
                          <label key={heading} className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox
                              checked={targetSections.includes(heading)}
                              onCheckedChange={(checked) => {
                                setTargetSections((prev) =>
                                  checked ? [...prev, heading] : prev.filter((s) => s !== heading)
                                );
                              }}
                            />
                            <span className="truncate">{heading}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button size="sm" onClick={handleUpgradeLinks} disabled={isBusy} className="w-full">
                    {upgradingLinks ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Link className="mr-1.5 h-3.5 w-3.5" />}
                    Run Upgrade
                  </Button>
                </PopoverContent>
              </Popover>

              {/* Generate FAQs with count selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isBusy} className="border-accent/30 text-accent hover:bg-accent/10">
                    {generatingFaqs ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />}
                    Generate FAQs
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 space-y-3" align="end">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Number of FAQs</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={3}
                        max={20}
                        value={faqCount}
                        onChange={(e) => setFaqCount(Number(e.target.value))}
                        className="flex-1 accent-accent"
                      />
                      <span className="text-sm font-mono w-6 text-center">{faqCount}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">AI will generate {faqCount} unique FAQ pairs and append them to the article.</p>
                  </div>
                  <Button size="sm" onClick={handleGenerateFaqs} disabled={isBusy} className="w-full">
                    {generatingFaqs ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />}
                    Generate {faqCount} FAQs
                  </Button>
                </PopoverContent>
              </Popover>
            </>
          )}
          {item.status === "writing" && (
            <Button size="sm" variant="outline" onClick={handleOptimize} disabled={isBusy} className="border-accent/30 text-accent hover:bg-accent/10">
              {optimizing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
              Optimize SEO
            </Button>
          )}
          {(item.status === "optimizing" || item.status === "unpublished") && (
            <Button size="sm" onClick={handlePublish} disabled={isBusy} className="bg-success hover:bg-success/90 text-success-foreground">
              {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Publish
            </Button>
          )}

          {draftContent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={isBusy}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg z-50">
                <DropdownMenuItem onClick={exportMarkdown}>Export as Markdown</DropdownMenuItem>
                <DropdownMenuItem onClick={exportHtml}>Export as HTML</DropdownMenuItem>
                <DropdownMenuItem onClick={exportDocx}>Export as DOCX</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPlainText}>Export as Plain Text</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button size="sm" variant="outline" onClick={handleSave} disabled={isBusy}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save
          </Button>
          {item.status !== "published" && item.status !== "monitoring" && (
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={isBusy}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
          )}
          {(item.status === "published" || item.status === "monitoring") && (
            <Button size="sm" variant="outline" onClick={handleUnpublish} disabled={isBusy} className="border-warning/30 text-warning hover:bg-warning/10">
              {unpublishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <EyeOff className="mr-1.5 h-3.5 w-3.5" />}
              Unpublish
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={isBusy} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this content?</AlertDialogTitle>
                <AlertDialogDescription>"{item.title}" and all related data (SEO scores, optimization jobs, etc.) will be permanently deleted. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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

      {/* Guide */}
      <ContentDetailGuide />

      {/* Tabs: Content + Fulfilment */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content & Metadata</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="aeo">AEO</TabsTrigger>
          <TabsTrigger value="fulfilment">SEO/GEO Fulfilment</TabsTrigger>
          <TabsTrigger value="history">History Versions</TabsTrigger>
          <TabsTrigger value="repurpose">Repurpose</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          {/* Hero image generate button (image shown in preview) */}
          <div className="rounded-lg border border-border bg-card mb-6 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Image Management</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Hero Image Card */}
              <div className="rounded-md border border-border p-3 space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">Hero</Badge>
                  {item.hero_image_url && <Badge variant="outline" className="text-[10px]">Active</Badge>}
                </div>
                {item.hero_image_url ? (
                  <div className="aspect-video w-full overflow-hidden rounded-md border border-border">
                    <img src={item.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-md border border-border bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Ratio</Label>
                  <ToggleGroup type="single" value={heroAspectRatio} onValueChange={(v) => v && setHeroAspectRatio(v)} className="flex flex-wrap gap-0.5">
                    {aspectRatios.map((r) => (
                      <ToggleGroupItem key={r} value={r} size="sm" className="h-6 px-1.5 text-[10px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{r}</ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Style</Label>
                    <Select value={heroStyle} onValueChange={setHeroStyle}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Default" /></SelectTrigger>
                      <SelectContent>{styleOptions.map((s) => <SelectItem key={s.value} value={s.value || "_default"} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Model</Label>
                    <Select value={heroModel} onValueChange={setHeroModel}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{modelOptions.map((m) => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  placeholder="Describe the hero image you want (leave blank for auto)"
                  value={imagePromptDescription}
                  onChange={(e) => setImagePromptDescription(e.target.value)}
                  className="min-h-[40px] text-xs flex-grow"
                  rows={2}
                />
                <Button size="sm" variant="outline" onClick={handleGenerateImage} disabled={isBusy} className="h-7 text-xs gap-1.5 w-full mt-auto">
                  {generatingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                  {item.hero_image_url ? "Regenerate" : "Generate"}
                </Button>
              </div>

              {/* Body Image Cards – always 2 slots */}
              {displayBodyImages.map((img, i) => {
                const bs = getBodySettings(i);
                return (
                  <div key={i} className="rounded-md border border-border p-3 space-y-2 flex flex-col">
                    <Badge variant="secondary" className="text-[10px]">Body {i + 1}</Badge>
                    <div className="aspect-video w-full overflow-hidden rounded-md border border-border flex items-center justify-center bg-muted/30">
                      {img.exists ? (
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Ratio</Label>
                      <ToggleGroup type="single" value={bs.aspectRatio} onValueChange={(v) => v && updateBodySettings(i, { aspectRatio: v })} className="flex flex-wrap gap-0.5">
                        {aspectRatios.map((r) => (
                          <ToggleGroupItem key={r} value={r} size="sm" className="h-6 px-1.5 text-[10px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{r}</ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Style</Label>
                        <Select value={bs.style} onValueChange={(v) => updateBodySettings(i, { style: v })}>
                          <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Default" /></SelectTrigger>
                          <SelectContent>{styleOptions.map((s) => <SelectItem key={s.value} value={s.value || "_default"} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Model</Label>
                        <Select value={bs.model} onValueChange={(v) => updateBodySettings(i, { model: v })}>
                          <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{modelOptions.map((m) => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      placeholder={`Describe ${img.exists ? "replacement" : "body image"} (leave blank for auto)`}
                      value={bodyImagePrompts[i] || ""}
                      onChange={(e) => setBodyImagePrompts((prev) => ({ ...prev, [i]: e.target.value }))}
                      className="min-h-[40px] text-xs flex-grow"
                      rows={2}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRegenerateBodyImage(i, img.exists ? img.fullMatch : null)}
                      disabled={isBusy}
                      className="h-7 text-xs gap-1.5 w-full mt-auto"
                    >
                      {regeneratingImageIndex === i ? <Loader2 className="h-3 w-3 animate-spin" /> : img.exists ? <RefreshCw className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                      {img.exists ? "Regenerate" : "Generate"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SERP Research Summary */}
          {item.serp_research && (
            <div className="rounded-lg border border-info/20 bg-info/5 mb-6 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-info" />
                <h3 className="text-sm font-semibold text-foreground">Competitor Intelligence</h3>
                <Badge variant="outline" className="text-[10px] border-info/30 text-info">{item.serp_research.raw_competitors?.length || 0} competitors analysed</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {item.serp_research.content_gaps?.length > 0 && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Content Gaps</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {item.serp_research.content_gaps.slice(0, 5).map((g: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-success mt-0.5">+</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.serp_research.competitor_weaknesses?.length > 0 && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Competitor Weaknesses</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {item.serp_research.competitor_weaknesses.slice(0, 5).map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-destructive mt-0.5">⚠</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground mb-1">Targets</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>Avg word count: <span className="font-mono text-foreground">{item.serp_research.avg_word_count || "—"}</span></p>
                    <p>Target: <span className="font-mono text-foreground">{item.serp_research.recommended_word_count || "—"}+ words</span></p>
                    <p>FAQs to answer: <span className="font-mono text-foreground">{item.serp_research.faq_questions?.length || 0}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  {viewMode === "edit" && (
                    <>
                      {selectedText && (
                        <Button size="sm" variant="ghost" onClick={handleSectionRewrite} disabled={sectionRewriting} className="h-7 px-2.5 text-xs text-accent border border-accent/30">
                          {sectionRewriting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <PenLine className="mr-1 h-3 w-3" />}
                          Rewrite Selection
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleRewrite("rewrite")} disabled={!!rewriting || !draftContent.trim()} className="h-7 px-2.5 text-xs">
                        {rewriting === "rewrite" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                        Rewrite
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRewrite("expand")} disabled={!!rewriting || !draftContent.trim()} className="h-7 px-2.5 text-xs">
                        {rewriting === "expand" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Maximize2 className="mr-1 h-3 w-3" />}
                        Expand
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRewrite("shorten")} disabled={!!rewriting || !draftContent.trim()} className="h-7 px-2.5 text-xs">
                        {rewriting === "shorten" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Minimize2 className="mr-1 h-3 w-3" />}
                        Shorten
                      </Button>
                    </>
                  )}
                  <div className="flex items-center border border-border rounded-md overflow-hidden ml-2">
                    <button
                      onClick={() => setViewMode("edit")}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setViewMode("preview")}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {viewMode === "edit" ? (
                  <Textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    onSelect={handleTextSelect}
                    onMouseUp={handleTextSelect}
                    placeholder="Draft content will appear here after the Content Generation agent runs..."
                    className="min-h-[400px] bg-background border-border font-mono text-sm leading-relaxed resize-y"
                  />
                ) : (
                  <ContentPreview
                    title={item.title}
                    seoTitle={seoTitle}
                    metaDescription={metaDescription}
                    author={item.author}
                    keyword={item.keyword}
                    heroImageUrl={item.hero_image_url}
                    draftContent={draftContent}
                    updatedAt={item.updated_at}
                  />
                )}
              </div>
            </div>

            {/* Metadata sidebar */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">SEO Metadata</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOptimize}
                    disabled={optimizing || !draftContent}
                    className="h-7 text-xs gap-1"
                  >
                    {optimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Generate
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">SEO Title</Label>
                  <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Meta title (≤60 chars)" maxLength={60} className="bg-background border-border text-sm" />
                  <p className="text-[10px] text-muted-foreground text-right">{seoTitle.length}/60</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Meta Description</Label>
                  <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Meta description (≤155 chars)" maxLength={155} className="bg-background border-border text-sm min-h-[80px]" />
                  <p className="text-[10px] text-muted-foreground text-right">{metaDescription.length}/155</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">URL Slug</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const source = item.title || item.keyword || "";
                        const stopWords = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","were"]);
                        const generated = source
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, "")
                          .split(/\s+/)
                          .filter((w) => w && !stopWords.has(w))
                          .join("-")
                          .replace(/-+/g, "-")
                          .slice(0, 100);
                        setSlug(generated);
                      }}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Auto-generate
                    </button>
                  </div>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" maxLength={100} className="bg-background border-border text-sm font-mono" />
                  {slug && (
                    <p className="text-[10px] text-muted-foreground font-mono">/blog/{slug}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Details</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Keyword</span><span className="font-mono text-foreground">{item.keyword}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Author</span><span className="text-foreground">{item.author}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Schema</span><span className="text-foreground">{(item.schema_types || []).join(", ") || "—"}</span></div>
                  {(item.url || slug) && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">URL</span>
                      <a href={item.url || `/blog/${slug}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary flex items-center gap-1 hover:underline truncate max-w-[200px]">
                        {item.url || `/blog/${slug}`} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  )}
                  {item.position && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Rank</span><span className="font-mono text-foreground">#{Number(item.position)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span className="text-foreground">{item.updated_at?.split("T")[0]}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          {(item.status === "published" || item.status === "monitoring") && (
            <ContentPerformanceChart contentId={contentId} keyword={item.keyword} />
          )}
        </TabsContent>

        <TabsContent value="optimization">
          <div className="rounded-lg border border-border bg-card p-5">
            <OptimizationTab contentItemId={contentId} />
          </div>
        </TabsContent>

        <TabsContent value="aeo">
          <div className="rounded-lg border border-border bg-card p-5">
            <AeoTab contentId={contentId} hasContent={!!draftContent.trim()} />
          </div>
        </TabsContent>

        <TabsContent value="fulfilment">
          <div className="rounded-lg border border-border bg-card p-5">
            <FulfilmentDashboard contentItemId={contentId} />
          </div>
        </TabsContent>

        <TabsContent value="repurpose">
          <div className="rounded-lg border border-border bg-card p-5">
            <RepurposeTab contentItemId={contentId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentDetail;
