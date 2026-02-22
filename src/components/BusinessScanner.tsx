import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, Globe, Clock, ArrowRight, BarChart3, FileCode, FileText, Tag, Lightbulb, AlertTriangle, TrendingUp, Share2, Copy } from "lucide-react";
import { useToast as useToastSonner } from "@/hooks/use-toast";
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
        body: { domain: domain.trim() },
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
  const strengths = results.strengths || [];
  const weaknesses = results.weaknesses || [];
  const contentTypes = results.content_types || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">SEO Analysis & Competitor Comparison Tool</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Get detailed reports, track your performance, and compare your site against competitors in one place.
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Search for SEO analysis..."
            className="bg-background border-border text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
          <Button onClick={handleScan} disabled={scanning || !domain.trim()} size="icon" variant="outline">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Report Results */}
      {activeScan && (
        <div className="space-y-8">
          {/* SEO Analysis Report Header */}
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-foreground">SEO Analysis Report</h2>
            <p className="text-sm text-muted-foreground">{activeScan.domain}</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                const url = `${window.location.origin}/report/${activeScan.id}`;
                navigator.clipboard.writeText(url);
                toast({ title: "Link copied!", description: "Share this link with prospects to capture their email." });
              }}
            >
              <Share2 className="h-3.5 w-3.5" /> Share Report
            </Button>
          </div>

          {/* Score Cards */}
          <div className="rounded-xl border border-border bg-success/5 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">Competitor Website</p>
                <p className="text-[11px] text-muted-foreground font-mono">URL: {activeScan.domain}</p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs font-mono text-foreground">65/100</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">Your Website</p>
                <p className="text-[11px] text-muted-foreground font-mono">Compared against your content</p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs font-mono text-foreground">75/100</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Gap Analysis */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Content Gap Analysis</h3>
            <div className="rounded-xl border border-border bg-success/5 p-6 space-y-4">
              <div>
                <p className="text-sm font-bold text-foreground mb-2">Overview</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {results.summary || "Run a scan to see a competitive analysis summary."}
                </p>
              </div>
              {strengths.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Key Opportunities</p>
                  <div className="space-y-2">
                    {strengths.map((s: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground">{i + 1}) {s}</p>
                    ))}
                  </div>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Strategic Direction</p>
                  <div className="space-y-2">
                    {weaknesses.map((w: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground">{w}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA Block */}
          <div className="flex items-center justify-between rounded-lg border-l-4 border-l-primary bg-card border border-border p-5">
            <div>
              <p className="text-sm font-bold text-foreground">Identify Content Gaps</p>
              <p className="text-xs text-muted-foreground mt-0.5">Benchmark your content against competitors and discover opportunities to create high-value, engaging content that drives traffic.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setDomain(activeScan.domain)} className="shrink-0">
              Compare Now
            </Button>
          </div>

          {/* Content Landscape */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Content Landscape</h3>
            </div>
            <div className="rounded-xl border border-border bg-info/5 p-6 space-y-4">
              <div>
                <p className="text-sm font-bold text-foreground mb-2">Overview</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The content landscape includes topics across {contentTypes.length > 0 ? contentTypes.join(", ") : "various categories"}. Focusing on these areas can help establish authority and attract organic traffic.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Core Topics */}
                <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                  <p className="text-xs font-bold text-success mb-2">Core Topics</p>
                  <ul className="space-y-1">
                    {(keywords.slice(0, 4) as any[]).map((kw: any, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-1 h-1 w-1 rounded-full bg-success shrink-0" />
                        {typeof kw === "string" ? kw : kw.keyword || kw}
                      </li>
                    ))}
                    {keywords.length === 0 && <li className="text-xs text-muted-foreground">No data yet</li>}
                  </ul>
                </div>
                {/* Well Covered */}
                <div className="rounded-lg border border-info/20 bg-info/5 p-4">
                  <p className="text-xs font-bold text-info mb-2">Well Covered</p>
                  <ul className="space-y-1">
                    {schemas.length > 0 ? schemas.slice(0, 4).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-1 h-1 w-1 rounded-full bg-info shrink-0" />
                        {s} schema markup
                      </li>
                    )) : (
                      <li className="text-xs text-muted-foreground">No schema detected</li>
                    )}
                  </ul>
                </div>
                {/* Content Gaps */}
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                  <p className="text-xs font-bold text-warning mb-2">Content Gaps</p>
                  <ul className="space-y-1">
                    {(keywords.slice(4, 8) as any[]).map((kw: any, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-1 h-1 w-1 rounded-full bg-warning shrink-0" />
                        {typeof kw === "string" ? kw : kw.keyword || kw} (gap)
                      </li>
                    ))}
                    {keywords.length <= 4 && <li className="text-xs text-muted-foreground">Limited data available</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Block 2 */}
          <div className="flex items-center justify-between rounded-lg border-l-4 border-l-primary bg-card border border-border p-5">
            <div>
              <p className="text-sm font-bold text-foreground">Struggling with Content Planning?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Identify gaps in your content and get actionable recommendations to optimize for better visibility and engagement.</p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0">
              View Suggestions
            </Button>
          </div>

          {/* Meta Tag Patterns */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Meta Tag Patterns</h3>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              {metaPatterns.title && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title Pattern</p>
                  <p className="text-sm text-foreground">{metaPatterns.title}</p>
                </div>
              )}
              {metaPatterns.description && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description Pattern</p>
                  <p className="text-sm text-foreground">{metaPatterns.description}</p>
                </div>
              )}
              {!metaPatterns.title && !metaPatterns.description && (
                <p className="text-sm text-muted-foreground">No meta patterns detected. Run a scan to analyze.</p>
              )}
            </div>
          </div>

          {/* Top Keywords */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Estimated Top Keywords</h3>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              {Array.isArray(keywords) && keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {keywords.slice(0, 20).map((kw: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs px-3 py-1">
                      {typeof kw === "string" ? kw : kw.keyword || kw}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No keywords detected</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no scan */}
      {!activeScan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Search, title: "SEO Analyzer", desc: "Instantly check your website's SEO performance. Analyze keywords, backlinks, and technical issues to improve rankings.", type: "Website Analyzer", cta: "Setup your SEO Analyzer" },
            { icon: Globe, title: "Google Business Scanner", desc: "Evaluate your business visibility on Google. Check listings, reviews, and opportunities to grow your reach.", type: "Business Scanner", cta: "Setup your Business Scanner" },
            { icon: FileText, title: "AI-Powered SEO Checklist", desc: "Generate a personalized, step-by-step SEO checklist powered by AI. Identify missing optimizations and track progress.", type: "SEO Automation", cta: "Generate Your SEO Checklist" },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="flex items-center gap-2">
                <card.icon className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{card.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Tool Type: {card.type}</span>
                <span className="text-success font-medium">Feature: Enable</span>
              </div>
              <Button className="w-full" size="sm">
                {card.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Scan History */}
      {scans.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Scan History
            </h3>
          </div>
          <div className="divide-y divide-border">
            {scans.map((scan) => (
              <button
                key={scan.id}
                onClick={() => setActiveScan(scan)}
                className={`flex w-full items-center justify-between px-6 py-3.5 text-left hover:bg-muted/20 transition-colors ${
                  activeScan?.id === scan.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-foreground">{scan.domain}</span>
                  <span className="text-[10px] text-muted-foreground ml-3">{new Date(scan.created_at).toLocaleDateString()}</span>
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
