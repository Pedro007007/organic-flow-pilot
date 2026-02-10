import { useState } from "react";
import { FileText, Plus, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

  const handleCreate = async (runAutopilot = false) => {
    if (!user || !title.trim() || !keyword.trim()) return;
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from("content_items")
        .insert({
          user_id: user.id,
          title: title.trim(),
          keyword: keyword.trim(),
          status: "discovery",
          author: "Agent",
        })
        .select("id")
        .single();

      if (error) throw error;

      toast({ title: "Content created" });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
      setTitle("");
      setKeyword("");
      setOpen(false);

      if (runAutopilot && data?.id) {
        setAutopilot(true);
        await runFullPipeline(data.id, keyword.trim(), title.trim());
        setAutopilot(false);
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const runFullPipeline = async (contentItemId: string, kw: string, ttl: string) => {
    try {
      // Step 1: Generate content
      toast({ title: "🚀 Autopilot: Generating content..." });
      const genRes = await supabase.functions.invoke("content-generate", {
        body: { contentItemId, keyword: kw, title: ttl },
      });
      if (genRes.error) throw genRes.error;

      // Step 2: Optimize SEO
      toast({ title: "🚀 Autopilot: Optimizing SEO..." });
      const optRes = await supabase.functions.invoke("seo-optimize", {
        body: { contentItemId, keyword: kw },
      });
      if (optRes.error) throw optRes.error;

      // Step 3: Publish
      toast({ title: "🚀 Autopilot: Publishing..." });
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
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Content Pipeline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track content through all agent stages</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Content Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="How to Improve Your SEO Rankings"
                  className="bg-background border-border text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Target Keyword</Label>
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="seo rankings"
                  className="bg-background border-border text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCreate(false)}
                  disabled={creating || !title.trim() || !keyword.trim()}
                  className="flex-1"
                >
                  {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                  Create
                </Button>
                <Button
                  onClick={() => handleCreate(true)}
                  disabled={creating || !title.trim() || !keyword.trim()}
                  variant="outline"
                  className="flex-1 border-accent/30 text-accent hover:bg-accent/10"
                >
                  {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Rocket className="mr-1.5 h-3.5 w-3.5" />}
                  Autopilot
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                <strong>Autopilot</strong> runs the full pipeline: Generate → Optimize → Publish
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

      <div className="divide-y divide-border/50">
        {content.map((item) => {
          const config = statusConfig[item.status];
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem?.(item.id)}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30 ${onSelectItem ? "cursor-pointer" : ""}`}
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
            </div>
          );
        })}
        {content.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">No content items yet. Click "New Content" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentPipeline;
