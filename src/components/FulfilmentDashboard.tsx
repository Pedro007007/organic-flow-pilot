import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Sparkles, ClipboardCheck, ArrowRight, Wand2 } from "lucide-react";

interface FulfilmentDashboardProps {
  contentItemId: string;
}

const CRITERIA = [
  { criterion: "Meta title set", category: "On-Page" },
  { criterion: "Meta description set", category: "On-Page" },
  { criterion: "Schema markup added", category: "Technical" },
  { criterion: "FAQ section present", category: "GEO" },
  { criterion: "Direct answer paragraph", category: "GEO" },
  { criterion: "Internal links added (≥3)", category: "On-Page" },
  { criterion: "H1 tag present", category: "On-Page" },
  { criterion: "Image alt attributes", category: "On-Page" },
  { criterion: "Word count ≥ 800", category: "Content" },
  { criterion: "Cited sources present", category: "GEO" },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "On-Page": { bg: "bg-success/5", text: "text-success", border: "border-success/20" },
  "Technical": { bg: "bg-info/5", text: "text-info", border: "border-info/20" },
  "GEO": { bg: "bg-warning/5", text: "text-warning", border: "border-warning/20" },
  "Content": { bg: "bg-primary/5", text: "text-primary", border: "border-primary/20" },
};

const FulfilmentDashboard = ({ contentItemId }: FulfilmentDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchFulfilment();
  }, [user, contentItemId]);

  const fetchFulfilment = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("seo_fulfilment").select("*").eq("user_id", user.id).eq("content_item_id", contentItemId);
    if (error) { toast({ title: "Failed to load fulfilment data", variant: "destructive" }); setLoading(false); return; }
    if (!data || data.length === 0) { await initializeFulfilment(); } else { setItems(data); }
    setLoading(false);
  };

  const initializeFulfilment = async () => {
    if (!user) return;
    const rows = CRITERIA.map((c) => ({ user_id: user.id, content_item_id: contentItemId, criterion: c.criterion, category: c.category, passed: false }));
    const { data, error } = await supabase.from("seo_fulfilment").insert(rows).select();
    if (error) { toast({ title: "Failed to initialize fulfilment", variant: "destructive" }); return; }
    setItems(data || []);
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await supabase.functions.invoke("fulfilment-scan", { body: { contentItemId } });
      if (res.error) throw res.error;
      toast({ title: "Fulfilment scan complete", description: `${res.data?.passed || 0} criteria passed` });
      await fetchFulfilment();
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally { setScanning(false); }
  };

  const handleFix = async (item: any) => {
    setFixingId(item.id);
    try {
      const res = await supabase.functions.invoke("fulfilment-fix", {
        body: { contentItemId, criterionId: item.id, criterion: item.criterion },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      toast({ title: "AI Fix Applied", description: `"${item.criterion}" has been fixed` });
      queryClient.invalidateQueries({ queryKey: ["content_items"] });
      await fetchFulfilment();
    } catch (err: any) {
      toast({ title: "Fix failed", description: err.message, variant: "destructive" });
    } finally { setFixingId(null); }
  };

  const handleFixAll = async () => {
    const failedItems = items.filter((i) => !i.passed);
    if (failedItems.length === 0) { toast({ title: "All criteria already passed!" }); return; }

    for (const item of failedItems) {
      await handleFix(item);
    }
    toast({ title: "All fixes applied", description: "Re-scanning to verify..." });
    await handleScan();
  };

  const passed = items.filter((i) => i.passed).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
  const categories = [...new Set(items.map((i) => i.category))];
  const hasFailures = items.some((i) => !i.passed);

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-foreground">SEO/GEO Fulfilment Score</h3>
            <p className="text-xs text-muted-foreground">{passed} of {total} criteria passed</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{percent}</p>
            <p className="text-[10px] text-muted-foreground">Score</p>
          </div>
          <Button size="sm" onClick={handleScan} disabled={scanning} className="btn-3d h-7 text-[11px] px-3">
            {scanning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            AI Scan
          </Button>
          {hasFailures && (
            <Button size="sm" onClick={handleFixAll} disabled={!!fixingId} className="btn-3d h-7 text-[11px] px-3">
              {fixingId ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
              Fix All
            </Button>
          )}
        </div>
      </div>

      <Progress value={percent} className="h-2.5" />

      {/* Categorized columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["Content"];
          const catItems = items.filter((i) => i.category === cat);
          const catPassed = catItems.filter((i) => i.passed).length;

          return (
            <div key={cat} className={`rounded-lg border ${colors.border} ${colors.bg} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold ${colors.text}`}>{cat}</p>
                <Badge variant="outline" className={`text-[9px] ${colors.border} ${colors.text}`}>
                  {catPassed}/{catItems.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      {item.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive/50 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] ${item.passed ? "text-muted-foreground" : "text-foreground"}`}>{item.criterion}</p>
                        {item.details && <p className="text-[10px] text-muted-foreground">{item.details}</p>}
                      </div>
                    </div>
                    {!item.passed && (
                      <Button
                        size="sm"
                        onClick={() => handleFix(item)}
                        disabled={fixingId === item.id}
                        className="btn-3d h-6 text-[10px] px-2.5 ml-5"
                      >
                        {fixingId === item.id ? (
                          <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Wand2 className="mr-1 h-2.5 w-2.5" />
                        )}
                        AI Fix
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between rounded-lg border-l-4 border-l-primary bg-muted/30 border border-border p-4">
        <div>
          <p className="text-sm font-bold text-foreground">Missing SEO Criteria?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Run the AI scan to check, then use AI Fix to automatically resolve each issue.</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleScan} disabled={scanning} className="shrink-0 h-7 text-[11px]">
          {scanning ? "Scanning..." : "Scan Now"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default FulfilmentDashboard;
