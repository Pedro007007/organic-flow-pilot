import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2, Circle, Minus, ChevronDown, Loader2, Sparkles, ListChecks, Info, ArrowRight, FileText, Globe, Zap,
} from "lucide-react";

const DEFAULT_CHECKLIST: { category: string; items: { label: string; description: string }[] }[] = [
  {
    category: "On-Page SEO",
    items: [
      { label: "Meta title set (≤60 chars)", description: "A concise, keyword-rich title tag under 60 characters for optimal SERP display." },
      { label: "Meta description set (≤155 chars)", description: "Compelling meta description under 155 characters that encourages clicks." },
      { label: "H1 tag present and unique", description: "Single H1 heading that matches the primary keyword intent of the page." },
      { label: "URL slug is clean and descriptive", description: "Short, lowercase, hyphenated URL slug with target keyword." },
      { label: "Image alt attributes set", description: "All images have descriptive alt text for accessibility and image SEO." },
      { label: "Internal links added (≥3)", description: "At least 3 internal links to related content for better crawlability." },
    ],
  },
  {
    category: "Technical SEO",
    items: [
      { label: "Canonical tag present", description: "Canonical URL set to prevent duplicate content issues." },
      { label: "Schema markup added", description: "Structured data (JSON-LD) added for rich snippets in search results." },
      { label: "Mobile responsive", description: "Page renders correctly on all device sizes." },
      { label: "Page load speed < 3s", description: "Page loads within 3 seconds for optimal user experience and ranking." },
      { label: "No broken links", description: "All outbound and internal links resolve correctly (no 404s)." },
    ],
  },
  {
    category: "Content Quality",
    items: [
      { label: "Word count ≥ 800", description: "Sufficient content depth for the topic — minimum 800 words for most blog posts." },
      { label: "Primary keyword in first 100 words", description: "Target keyword appears naturally within the opening paragraph." },
      { label: "Subheadings use H2/H3 hierarchy", description: "Proper heading structure for scannability and SEO." },
      { label: "No duplicate content", description: "Content is original and not duplicated from other pages on the site." },
      { label: "Readability score adequate", description: "Content is written at an appropriate reading level for the target audience." },
    ],
  },
  {
    category: "GEO Readiness",
    items: [
      { label: "Direct answer paragraph present", description: "A clear, concise answer paragraph that AI engines can extract and cite." },
      { label: "FAQ section included", description: "Frequently asked questions section with structured Q&A pairs." },
      { label: "Cited sources / references", description: "External authoritative sources cited to build credibility with AI engines." },
      { label: "Conversational tone sections", description: "Some content written in natural, conversational style that mirrors how people ask questions." },
      { label: "Entity-rich content", description: "Named entities (people, places, products) clearly identified for knowledge graph matching." },
    ],
  },
  {
    category: "Link Building",
    items: [
      { label: "External authority links (≥2)", description: "At least 2 outbound links to authoritative, relevant external sources." },
      { label: "Social sharing metadata", description: "Open Graph and Twitter Card meta tags set for social media sharing." },
      { label: "Backlink outreach planned", description: "Strategy identified for acquiring backlinks to this content." },
    ],
  },
];

const SeoChecklist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>(
    DEFAULT_CHECKLIST.map((c) => c.category)
  );

  useEffect(() => {
    if (!user) return;
    fetchChecklist();
  }, [user]);

  const fetchChecklist = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("seo_checklists").select("*").eq("user_id", user.id).is("content_item_id", null);
    if (error) { toast({ title: "Failed to load checklist", variant: "destructive" }); setLoading(false); return; }
    if (!data || data.length === 0) { await initializeChecklist(); } else { setItems(data); }
    setLoading(false);
  };

  const initializeChecklist = async () => {
    if (!user) return;
    const rows = DEFAULT_CHECKLIST.flatMap((cat) =>
      cat.items.map((item) => ({ user_id: user.id, category: cat.category, item_label: item.label, description: item.description, status: "pending", auto_verified: false }))
    );
    const { data, error } = await supabase.from("seo_checklists").insert(rows).select();
    if (error) { toast({ title: "Failed to create checklist", variant: "destructive" }); return; }
    setItems(data || []);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "done" : currentStatus === "done" ? "na" : "pending";
    const { error } = await supabase.from("seo_checklists")
      .update({ status: nextStatus, verified_at: nextStatus === "done" ? new Date().toISOString() : null }).eq("id", id);
    if (error) { toast({ title: "Update failed", variant: "destructive" }); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: nextStatus } : i)));
  };

  const handleAutoCheck = async () => {
    setVerifying(true);
    try {
      const res = await supabase.functions.invoke("checklist-verify", { body: {} });
      if (res.error) throw res.error;
      toast({ title: "Auto-check complete", description: `${res.data?.verified || 0} items verified` });
      await fetchChecklist();
    } catch (err: any) {
      toast({ title: "Auto-check failed", description: err.message, variant: "destructive" });
    } finally { setVerifying(false); }
  };

  const categorized = DEFAULT_CHECKLIST.map((cat) => ({
    category: cat.category,
    items: items.filter((i) => i.category === cat.category),
  }));

  const totalItems = items.length;
  const doneItems = items.filter((i) => i.status === "done").length;
  const overallPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "done") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "na") return <Minus className="h-4 w-4 text-muted-foreground" />;
    return <Circle className="h-4 w-4 text-muted-foreground/50" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">AI-Powered SEO Checklist</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Generate a personalized, step-by-step SEO checklist powered by AI. Identify missing optimizations, track progress, and receive smart suggestions tailored to your website's goals.
        </p>
        <Button onClick={handleAutoCheck} disabled={verifying} className="mx-auto">
          {verifying ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          Auto-Check with AI
        </Button>
      </div>

      {/* Overall Score */}
      <div className="rounded-xl border border-border bg-success/5 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-foreground">Overall Completion</p>
            <p className="text-xs text-muted-foreground">{doneItems} of {totalItems} items completed</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{overallPercent}</p>
            <p className="text-[10px] text-muted-foreground">Score</p>
          </div>
        </div>
        <Progress value={overallPercent} className="h-2.5" />
      </div>

      {/* Category sections */}
      <TooltipProvider>
        <div className="space-y-4">
          {categorized.map((cat) => {
            const catDone = cat.items.filter((i) => i.status === "done").length;
            const catTotal = cat.items.length;
            const catPercent = catTotal > 0 ? Math.round((catDone / catTotal) * 100) : 0;
            const isOpen = openCategories.includes(cat.category);

            return (
              <Collapsible
                key={cat.category}
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenCategories((prev) => open ? [...prev, cat.category] : prev.filter((c) => c !== cat.category))
                }
              >
                <div className="rounded-xl border border-border bg-card">
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">{cat.category}</span>
                      <Badge variant="secondary" className="text-[10px]">{catDone}/{catTotal}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-28">
                        <Progress value={catPercent} className="h-1.5" />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{catPercent}%</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border divide-y divide-border">
                      {cat.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleStatus(item.id, item.status)}
                          className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-muted/20 transition-colors"
                        >
                          <StatusIcon status={item.status} />
                          <span className={`flex-1 text-xs ${item.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {item.item_label}
                          </span>
                          {item.auto_verified && (
                            <Badge variant="outline" className="text-[9px] border-success/30 text-success">AI Verified</Badge>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[240px] text-xs">{item.description}</TooltipContent>
                          </Tooltip>
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </TooltipProvider>

      {/* CTA Blocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border-l-4 border-l-primary bg-card border border-border p-5">
          <div>
            <p className="text-sm font-bold text-foreground">Need Help Optimizing?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Run the AI auto-check to automatically verify items against your actual content and get smart recommendations.</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleAutoCheck} disabled={verifying} className="shrink-0">
            {verifying ? "Checking..." : "Run AI Check"}
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-lg border-l-4 border-l-success bg-card border border-border p-5">
          <div>
            <p className="text-sm font-bold text-foreground">Improve Your Content Strategy</p>
            <p className="text-xs text-muted-foreground mt-0.5">Enhance the quality, structure, and readability of your content to boost SEO performance and user engagement.</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0">View Suggestions</Button>
        </div>
      </div>
    </div>
  );
};

export default SeoChecklist;
