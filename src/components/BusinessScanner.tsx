import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Search, Globe, Clock, Tag, FileCode, FileText } from "lucide-react";

const BusinessScanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [domain, setDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScan, setActiveScan] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    fetchScans();
  }, [user]);

  const fetchScans = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("competitor_scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setScans(data || []);
    if (data && data.length > 0 && !activeScan) setActiveScan(data[0]);
    setLoading(false);
  };

  const handleScan = async () => {
    if (!domain.trim()) return;
    setScanning(true);
    try {
      const res = await supabase.functions.invoke("business-scanner", {
        body: { domain: domain.trim(), userId: user?.id },
      });
      if (res.error) throw res.error;
      toast({ title: "Scan complete", description: `Analyzed ${domain}` });
      setDomain("");
      await fetchScans();
      if (res.data?.scan) setActiveScan(res.data.scan);
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const results = activeScan?.scan_results || {};
  const keywords = activeScan?.keywords_found || [];
  const schemas = activeScan?.schema_types || [];
  const metaPatterns = activeScan?.meta_patterns || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Input */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Business Scanner</h2>
          <p className="text-xs text-muted-foreground">Analyze competitor SEO strategies</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter competitor domain (e.g. example.com)"
          className="bg-background border-border text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
        />
        <Button onClick={handleScan} disabled={scanning || !domain.trim()}>
          {scanning ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}
          Scan
        </Button>
      </div>

      {/* Results */}
      {activeScan && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Keywords */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Top Keywords</h3>
            </div>
            {Array.isArray(keywords) && keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {keywords.slice(0, 20).map((kw: any, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">
                    {typeof kw === "string" ? kw : kw.keyword || kw}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No keywords detected</p>
            )}
          </Card>

          {/* Schema Types */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Schema Markup</h3>
            </div>
            {schemas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {schemas.map((s: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[11px] font-mono">{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No schema detected</p>
            )}
          </Card>

          {/* Meta Patterns */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Meta Tag Patterns</h3>
            </div>
            <div className="space-y-2 text-xs">
              {metaPatterns.title && (
                <div>
                  <span className="text-muted-foreground">Title: </span>
                  <span className="text-foreground">{metaPatterns.title}</span>
                </div>
              )}
              {metaPatterns.description && (
                <div>
                  <span className="text-muted-foreground">Description: </span>
                  <span className="text-foreground">{metaPatterns.description}</span>
                </div>
              )}
              {!metaPatterns.title && !metaPatterns.description && (
                <p className="text-muted-foreground">No meta patterns detected</p>
              )}
            </div>
          </Card>

          {/* Summary / Gap Analysis */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Analysis Summary</h3>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              {results.summary || "Run a scan to see a competitive analysis summary."}
            </p>
          </Card>
        </div>
      )}

      {/* Scan History */}
      {scans.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Scan History
            </h3>
          </div>
          <div className="divide-y divide-border">
            {scans.map((scan) => (
              <button
                key={scan.id}
                onClick={() => setActiveScan(scan)}
                className={`flex w-full items-center justify-between px-5 py-3 text-left hover:bg-muted/20 transition-colors ${
                  activeScan?.id === scan.id ? "bg-primary/5" : ""
                }`}
              >
                <div>
                  <span className="text-xs font-medium text-foreground">{scan.domain}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{new Date(scan.created_at).toLocaleDateString()}</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {(scan.keywords_found as any[])?.length || 0} keywords
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessScanner;
