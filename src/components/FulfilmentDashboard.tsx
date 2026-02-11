import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Sparkles, ClipboardCheck } from "lucide-react";

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
    const { data, error } = await supabase
      .from("seo_fulfilment")
      .select("*")
      .eq("user_id", user.id)
      .eq("content_item_id", contentItemId);

    if (error) {
      toast({ title: "Failed to load fulfilment data", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      await initializeFulfilment();
    } else {
      setItems(data);
    }
    setLoading(false);
  };

  const initializeFulfilment = async () => {
    if (!user) return;
    const rows = CRITERIA.map((c) => ({
      user_id: user.id,
      content_item_id: contentItemId,
      criterion: c.criterion,
      category: c.category,
      passed: false,
    }));

    const { data, error } = await supabase.from("seo_fulfilment").insert(rows).select();
    if (error) {
      toast({ title: "Failed to initialize fulfilment", variant: "destructive" });
      return;
    }
    setItems(data || []);
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await supabase.functions.invoke("fulfilment-scan", {
        body: { contentItemId, userId: user?.id },
      });
      if (res.error) throw res.error;
      toast({ title: "Fulfilment scan complete", description: `${res.data?.passed || 0} criteria passed` });
      await fetchFulfilment();
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const passed = items.filter((i) => i.passed).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;

  const categories = [...new Set(items.map((i) => i.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">SEO/GEO Fulfilment</h3>
          <Badge variant="secondary" className="text-[10px]">{percent}%</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={handleScan} disabled={scanning} className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10">
          {scanning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
          AI Scan
        </Button>
      </div>

      <Progress value={percent} className="h-2" />

      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{cat}</p>
          <div className="space-y-1">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted/20 transition-colors">
                  {item.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive/60" />
                  )}
                  <span className={`text-xs ${item.passed ? "text-muted-foreground" : "text-foreground"}`}>
                    {item.criterion}
                  </span>
                  {item.details && (
                    <span className="text-[10px] text-muted-foreground ml-auto">{item.details}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FulfilmentDashboard;
