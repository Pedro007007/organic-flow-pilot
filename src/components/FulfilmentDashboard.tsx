import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Sparkles, ClipboardCheck, ArrowRight } from "lucide-react";

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
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

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

  const passed = items.filter((i) => i.passed).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
  const categories = [...new Set(items.map((i) => i.category))];

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
          <Button size="sm" onClick={handleScan} disabled={scanning} className="h-8 text-xs">
            {scanning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            AI Scan
          </Button>
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
                  <div key={item.id} className="flex items-start gap-2">
                    {item.passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive/50 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-[11px] ${item.passed ? "text-muted-foreground" : "text-foreground"}`}>{item.criterion}</p>
                      {item.details && <p className="text-[10px] text-muted-foreground">{item.details}</p>}
                    </div>
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
          <p className="text-xs text-muted-foreground mt-0.5">Run the AI scan to automatically check this content against all SEO and GEO best practices.</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleScan} disabled={scanning} className="shrink-0">
          {scanning ? "Scanning..." : "Scan Now"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default FulfilmentDashboard;
