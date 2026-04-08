import { useState, useMemo, useEffect } from "react";
import { FileText, Plus, Rocket, Loader2, Search, Filter, CheckSquare, Square, Download, Tag, X, Link, Sparkles, Trash2, EyeOff, Lightbulb, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { ContentItem } from "@/types/seo";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  discovery: { label: "Discovery", color: "text-info", bg: "bg-info/15 border-info/20" },
  strategy: { label: "Strategy", color: "text-warning", bg: "bg-warning/15 border-warning/20" },
  writing: { label: "Writing", color: "text-primary", bg: "bg-primary/15 border-primary/20" },
  optimizing: { label: "Optimizing", color: "text-warning", bg: "bg-warning/15 border-warning/20" },
  unpublished: { label: "Unpublished", color: "text-muted-foreground", bg: "bg-muted border-border" },
  published: { label: "Published", color: "text-success", bg: "bg-success/15 border-success/20" },
  monitoring: { label: "Monitoring", color: "text-success", bg: "bg-success/15 border-success/20" },
};

interface ContentPipelineProps {
  content: ContentItem[];
  onSelectItem?: (id: string) => void;
}

const ContentPipeline = ({ content, onSelectItem }: ContentPipelineProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  const [creating, setCreating] = useState(false);
  const [autopilot, setAutopilot] = useState(false);
  const [brandId, setBrandId] = useState<string>("");
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [context, setContext] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>([]);
  const [refLinkInput, setRefLinkInput] = useState("");
  const [extraKeywords, setExtraKeywords] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestingTitles, setSuggestingTitles] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<{ title: string; style: string }[]>([]);
  const [fetchingRefs, setFetchingRefs] = useState(false);

  const handleAiSuggest = async () => {
    if (!title.trim()) {
      toast({ title: "Enter a title first", variant: "destructive" });
      return;
    }
    setSuggesting(true);
    try {
      const brandName = brands.find(b => b.id === brandId)?.name;
      const { data, error } = await supabase.functions.invoke("content-suggest", {
        body: { title: title.trim(), brandName },
      });
      if (error) throw error;
      if (data?.keyword) setKeyword(data.keyword);
      if (data?.extraKeywords) setExtraKeywords(data.extraKeywords);
      if (data?.context) setContext(data.context);
      toast({ title: "✨ AI suggestions applied" });
    } catch (err: any) {
      toast({ title: "AI suggest failed", description: err.message, variant: "destructive" });
    } finally {
      setSuggesting(false);
    }
  };

  const handleSuggestTitles = async () => {
    if (!keyword.trim() && !title.trim()) {
      toast({ title: "Enter a keyword or title first", variant: "destructive" });
      return;
    }
    setSuggestingTitles(true);
    setTitleSuggestions([]);
    try {
      const brandName = brands.find(b => b.id === brandId)?.name;
      const { data, error } = await supabase.functions.invoke("suggest-titles", {
        body: { keyword: keyword.trim() || undefined, topic: title.trim() || undefined, brandName },
      });
      if (error) throw error;
      if (data?.titles?.length) {
        setTitleSuggestions(data.titles);
        toast({ title: `💡 ${data.titles.length} title suggestions ready` });
      } else {
        toast({ title: "No suggestions returned", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Title suggestion failed", description: err.message, variant: "destructive" });
    } finally {
      setSuggestingTitles(false);
    }
  };

  const handleAutoReferences = async () => {
    if (!title.trim() && !keyword.trim()) {
      toast({ title: "Enter a title or keyword first", variant: "destructive" });
      return;
    }
    setFetchingRefs(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-references", {
        body: { title: title.trim() || undefined, keyword: keyword.trim() || undefined },
      });
      if (error) throw error;
      if (data?.references?.length) {
        const newLinks = data.references.map((r: any) => r.url).filter((url: string) => !referenceLinks.includes(url));
        setReferenceLinks([...referenceLinks, ...newLinks]);
        toast({ title: `🔗 ${newLinks.length} reference links added` });
      } else {
        toast({ title: "No references found", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Auto-reference failed", description: err.message, variant: "destructive" });
    } finally {
      setFetchingRefs(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("brands").select("id, name, is_default").order("created_at").then(({ data }) => {
      if (data) {
        setBrands(data);
        const def = data.find((b: any) => b.is_default);
        if (def) setBrandId(def.id);
      }
    });
  }, [user]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = content;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.keyword.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [content, search, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    const ids = Array.from(selectedIds);
    const isUnpublishing = newStatus !== "published" && newStatus !== "monitoring";
    const updatePayload: Record<string, any> = { status: newStatus };
    if (isUnpublishing) updatePayload.url = null;
    const { error } = await supabase
      .from("content_items")
      .update(updatePayload)
      .in("id", ids);

    setBulkUpdating(false);
    if (error) {
      toast({ title: "Bulk update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} items moved to ${statusConfig[newStatus]?.label || newStatus}` });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("content_items").delete().in("id", ids);
    setBulkDeleting(false);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} item${ids.length > 1 ? "s" : ""} deleted` });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    }
  };

  const handleSingleDelete = async (id: string) => {
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content deleted" });
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    }
    setDeleteConfirmId(null);
  };

  const handleUnpublish = async (id: string) => {
    const { error } = await supabase
      .from("content_items")
      .update({ status: "unpublished", url: null })
      .eq("id", id);
    if (error) {
      toast({ title: "Unpublish failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Unpublished", description: "Article removed from the public blog and marked as Unpublished." });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    }
  };

  const handleCreate = async (runAutopilot = false) => {
    if (!user || !title.trim() || !keyword.trim()) return;
    setCreating(true);

    const savedTitle = title.trim();
    const savedKeyword = keyword.trim();
    const savedBrandId = brandId || undefined;
    const savedContext = context.trim() || undefined;
    const savedRefLinks = referenceLinks.length > 0 ? [...referenceLinks] : undefined;
    const savedExtraKw = extraKeywords.trim() ? extraKeywords.split(",").map(k => k.trim()).filter(Boolean) : undefined;

    try {
      const { data, error } = await supabase
        .from("content_items")
        .insert({
          user_id: user.id,
          title: savedTitle,
          keyword: savedKeyword,
          status: "discovery",
          author: "Agent",
          brand_id: savedBrandId || null,
          context: savedContext || null,
          reference_links: savedRefLinks || null,
          extra_keywords: savedExtraKw || null,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      toast({ title: "Content created" });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
      setTitle(""); setKeyword(""); setContext(""); setReferenceLinks([]); setRefLinkInput(""); setExtraKeywords(""); setTitleSuggestions([]);
      setOpen(false);

      if (data?.id) {
        if (runAutopilot) {
          setAutopilot(true);
          await runFullPipeline(data.id, savedKeyword, savedTitle, savedBrandId, savedContext, savedRefLinks, savedExtraKw);
          setAutopilot(false);
        } else {
          // Generate article + SEO metadata (no publish)
          setAutopilot(true);
          try {
            // Step 1: SERP Research
            toast({ title: "🔍 Researching competitors..." });
            let serpResearch: any = null;
            try {
              const serpRes = await supabase.functions.invoke("serp-research", {
                body: { contentItemId: data.id, keyword: savedKeyword, limit: 10 },
              });
              if (!serpRes.error && serpRes.data?.analysis) serpResearch = serpRes.data.analysis;
            } catch { console.warn("SERP research skipped"); }

            // Step 2: Content Strategy
            toast({ title: "📋 Building strategy..." });
            let strategy: any = null;
            try {
              const stratRes = await supabase.functions.invoke("content-strategy", {
                body: { keyword: savedKeyword, serpResearch },
              });
              if (!stratRes.error && stratRes.data?.strategy) strategy = stratRes.data.strategy;
            } catch { console.warn("Content strategy skipped"); }

            // Step 3: Content Generation
            toast({ title: "✍️ Writing content..." });
            const genRes = await supabase.functions.invoke("content-generate", {
              body: { contentItemId: data.id, keyword: savedKeyword, title: savedTitle, serpResearch, strategy, brandId: savedBrandId, context: savedContext, referenceLinks: savedRefLinks, extraKeywords: savedExtraKw },
            });
            if (genRes.error) throw genRes.error;

            // Step 4: Hero Image
            toast({ title: "🎨 Generating hero image..." });
            try {
              await supabase.functions.invoke("generate-hero-image", {
                body: { contentItemId: data.id, keyword: savedKeyword, title: savedTitle, brandId: savedBrandId },
              });
            } catch { console.warn("Hero image skipped"); }

            toast({ title: "✅ Article ready!", description: "Content generated — run SEO Optimization manually when ready." });
            queryClient.invalidateQueries({ queryKey: ["content_items"] });
          } catch (err: any) {
            toast({ title: "Generation failed", description: err.message, variant: "destructive" });
            queryClient.invalidateQueries({ queryKey: ["content_items"] });
          } finally {
            setAutopilot(false);
          }
        }
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const runFullPipeline = async (contentItemId: string, kw: string, ttl: string, pipelineBrandId?: string, pipelineContext?: string, pipelineRefLinks?: string[], pipelineExtraKw?: string[]) => {
    try {
      // Step 1: SERP Research
      toast({ title: "🔍 Autopilot: Researching competitors..." });
      let serpResearch: any = null;
      try {
        const serpRes = await supabase.functions.invoke("serp-research", {
          body: { contentItemId, keyword: kw, limit: 10 },
        });
        if (!serpRes.error && serpRes.data?.analysis) {
          serpResearch = serpRes.data.analysis;
        }
      } catch {
        console.warn("SERP research skipped (Firecrawl may not be configured)");
      }

      // Step 2: Content Strategy (with SERP data)
      toast({ title: "📋 Autopilot: Building strategy..." });
      let strategy: any = null;
      try {
        const stratRes = await supabase.functions.invoke("content-strategy", {
          body: { keyword: kw, serpResearch },
        });
        if (!stratRes.error && stratRes.data?.strategy) {
          strategy = stratRes.data.strategy;
        }
      } catch {
        console.warn("Content strategy skipped");
      }

      // Step 3: Content Generation (with SERP + strategy)
      toast({ title: "✍️ Autopilot: Writing content..." });
      const genRes = await supabase.functions.invoke("content-generate", {
        body: { contentItemId, keyword: kw, title: ttl, serpResearch, strategy, brandId: pipelineBrandId, context: pipelineContext, referenceLinks: pipelineRefLinks, extraKeywords: pipelineExtraKw },
      });
      if (genRes.error) throw genRes.error;

      // Step 4: Hero Image Generation
      toast({ title: "🎨 Autopilot: Generating hero image..." });
      try {
        await supabase.functions.invoke("generate-hero-image", {
          body: { contentItemId, keyword: kw, title: ttl, brandId: pipelineBrandId },
        });
      } catch {
        console.warn("Hero image generation skipped");
      }

      // Step 5: SEO Optimization
      toast({ title: "🔧 Autopilot: Optimizing SEO..." });
      const optRes = await supabase.functions.invoke("seo-optimize", {
        body: { contentItemId, keyword: kw, brandId: pipelineBrandId },
      });
      if (optRes.error) throw optRes.error;

      // Step 6: Publishing
      toast({ title: "📤 Autopilot: Publishing..." });
      const pubRes = await supabase.functions.invoke("publish-webhook", {
        body: { contentItemId },
      });
      if (pubRes.error) throw pubRes.error;

      toast({ title: "✅ Autopilot complete!", description: pubRes.data?.url || "Content published" });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    } catch (err: any) {
      toast({ title: "Autopilot failed", description: err.message, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
    }
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-md overflow-hidden">
      <div className="border-b border-border/30 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-wide">Content Pipeline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track content through all agent stages</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Content Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-primary hover:text-primary" onClick={handleSuggestTitles} disabled={suggestingTitles || (!keyword.trim() && !title.trim())}>
                    {suggestingTitles ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
                    AI Titles
                  </Button>
                </div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How to Improve Your SEO Rankings" className="bg-background border-border text-sm" />
                {titleSuggestions.length > 0 && (
                  <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                    <p className="text-[10px] font-medium text-primary">Pick a title:</p>
                    {titleSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left rounded-md px-2.5 py-1.5 text-xs hover:bg-primary/10 transition-colors flex items-center justify-between gap-2 group"
                        onClick={() => { setTitle(s.title); setTitleSuggestions([]); }}
                      >
                        <span className="text-foreground">{s.title}</span>
                        <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0">{s.style}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Target Keyword</Label>
                  <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-accent hover:text-accent" onClick={handleAiSuggest} disabled={suggesting || !title.trim()}>
                    {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Suggest
                  </Button>
                </div>
                <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="seo rankings" className="bg-background border-border text-sm font-mono" />
              </div>
              {brands.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Brand</Label>
                  <Select value={brandId} onValueChange={setBrandId}>
                    <SelectTrigger className="bg-background border-border text-sm">
                      <Tag className="h-3 w-3 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Select brand..." />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Context & Instructions</Label>
                <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Add background context, specific instructions, or notes for the AI... (up to 1,000 words)" className="bg-background border-border text-sm min-h-[120px]" maxLength={7000} />
                <p className="text-[10px] text-muted-foreground text-right">{context.trim().split(/\s+/).filter(Boolean).length} / 1,000 words</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Link className="h-3 w-3" /> Reference Links</Label>
                  <Button type="button" size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-accent hover:text-accent" onClick={handleAutoReferences} disabled={fetchingRefs || (!title.trim() && !keyword.trim())}>
                    {fetchingRefs ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                    Auto-Scrape Top 3
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input value={refLinkInput} onChange={(e) => setRefLinkInput(e.target.value)} placeholder="https://example.com/article" className="bg-background border-border text-sm flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const url = refLinkInput.trim(); if (url && !referenceLinks.includes(url)) { setReferenceLinks([...referenceLinks, url]); setRefLinkInput(""); } } }} />
                  <Button type="button" size="sm" variant="outline" onClick={() => { const url = refLinkInput.trim(); if (url && !referenceLinks.includes(url)) { setReferenceLinks([...referenceLinks, url]); setRefLinkInput(""); } }}>Add</Button>
                </div>
                {referenceLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {referenceLinks.map((link, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground max-w-[220px]">
                        <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
                        <button onClick={() => setReferenceLinks(referenceLinks.filter((_, j) => j !== i))} className="hover:text-foreground"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Extra Keywords</Label>
                <Input value={extraKeywords} onChange={(e) => setExtraKeywords(e.target.value)} placeholder="e.g. local seo, google ranking, organic traffic" className="bg-background border-border text-sm" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleCreate(false)} disabled={creating || !title.trim() || !keyword.trim()} className="flex-1">
                  {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
                  Create & Generate
                </Button>
                <Button onClick={() => handleCreate(true)} disabled={creating || !title.trim() || !keyword.trim()} variant="outline" className="flex-1 border-accent/30 text-accent hover:bg-accent/10">
                  {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Rocket className="mr-1.5 h-3.5 w-3.5" />}
                  Autopilot
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                <strong>Create & Generate</strong>: Research → Write → Image → SEO metadata &nbsp;|&nbsp; <strong>Autopilot</strong>: + Publish
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {autopilot && (
        <div className="px-5 py-3 bg-accent/5 border-b border-accent/20 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          <span className="text-xs font-medium text-accent">Autopilot running — generating, optimizing, and publishing...</span>
        </div>
      )}

      {/* Filters & Bulk Actions */}
      <div className="border-b border-border/30 px-5 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..." className="pl-8 h-8 text-sm bg-background border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border">
            <Filter className="h-3 w-3 mr-1.5" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-muted-foreground">{selectedIds.size} selected</span>
            <Select onValueChange={handleBulkStatusChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border" disabled={bulkUpdating}>
                {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                <SelectValue placeholder="Move to..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10" disabled={bulkDeleting}>
                  {bulkDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete the selected content and all related data (SEO scores, optimization jobs, etc.). This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <span className="text-[10px] text-muted-foreground">{filtered.length} items</span>
        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 ml-auto" onClick={() => {
          const csv = ["Title,Keyword,Status,Position,Clicks,Last Updated", ...filtered.map(c => `"${c.title}","${c.keyword}","${c.status}",${c.position || ""},${c.clicks || ""},"${c.lastUpdated}"`)].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "content-pipeline.csv"; a.click(); URL.revokeObjectURL(url);
        }}>
          <Download className="h-3 w-3" /> Export
        </Button>
      </div>

      <div className="divide-y divide-border/30">
        {/* Select all row */}
        {filtered.length > 0 && (
          <div className="px-5 py-2 flex items-center gap-2">
            <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
              {selectedIds.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span className="text-[10px] text-muted-foreground">Select all</span>
          </div>
        )}
        {filtered.map((item) => {
          const config = statusConfig[item.status];
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              className={`group flex items-center gap-4 px-5 py-3.5 transition-all duration-300 hover:bg-muted/20 ${isSelected ? "bg-primary/5" : ""}`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
              </button>
              <div
                onClick={() => onSelectItem?.(item.id)}
                className={`flex flex-1 items-center gap-4 min-w-0 ${onSelectItem ? "cursor-pointer" : ""}`}
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{item.keyword}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">{item.lastUpdated}</span>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                {item.seoScore != null && (
                  <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold font-mono ${
                    item.seoScore >= 75 ? "bg-success/15 border-success/20 text-success" :
                    item.seoScore >= 50 ? "bg-warning/15 border-warning/20 text-warning" :
                    "bg-destructive/15 border-destructive/20 text-destructive"
                  }`}>
                    {item.seoScore}
                  </span>
                )}
                {item.status === "published" && item.position && (
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-xs text-foreground">#{item.position}</p>
                      <p className="text-[10px] text-muted-foreground">rank</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-foreground">{item.clicks?.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">clicks</p>
                    </div>
                  </div>
                )}
                {(item.status === "published" || item.status === "monitoring") && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUnpublish(item.id); }}
                    className="text-warning/70 hover:text-warning transition-all shrink-0"
                    title="Unpublish"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </button>
                )}
                <AlertDialog open={deleteConfirmId === item.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this content?</AlertDialogTitle>
                      <AlertDialogDescription>"{item.title}" and all related data will be permanently deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSingleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {content.length === 0 ? 'No content items yet. Click "New Content" to get started.' : "No items match your filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentPipeline;
