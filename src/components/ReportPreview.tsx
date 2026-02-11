import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Globe, BarChart3, FileText, Tag, ArrowRight, CheckCircle2, XCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface ReportSettings {
  headline_text: string;
  headline_size: string;
  subheadline_text: string;
  show_headline: boolean;
  show_subheadline: boolean;
  hide_blurbs: boolean;
  show_legal_links: boolean;
  show_disclaimer: boolean;
  disclaimer_text: string;
  colors: { primary: string; background: string; accent: string };
  cta_blocks: Array<{
    id: string;
    title: string;
    description: string;
    button_text: string;
    redirect_url: string;
    enabled: boolean;
  }>;
}

interface ReportPreviewProps {
  settings: ReportSettings;
  scanData?: any;
  isPublic?: boolean;
  onLivePreview?: () => void;
}

const headlineSizeClass: Record<string, string> = {
  small: "text-base",
  medium: "text-xl",
  large: "text-2xl",
};

const ReportPreview = ({ settings, scanData, isPublic = false, onLivePreview }: ReportPreviewProps) => {
  const results = scanData?.scan_results || {};
  const keywords = scanData?.keywords_found || [];
  const schemas = scanData?.schema_types || [];
  const metaPatterns = scanData?.meta_patterns || {};
  const strengths = results.strengths || [];
  const weaknesses = results.weaknesses || [];
  const contentTypes = results.content_types || [];
  const domain = scanData?.domain || "example.com";

  const primaryColor = settings.colors?.primary || "#6366f1";
  const bgColor = settings.colors?.background || "#ffffff";
  const accentColor = settings.colors?.accent || "#f59e0b";

  const enabledCtas = (settings.cta_blocks || []).filter((c) => c.enabled);

  // Dummy scores
  const competitorScore = results.competitor_score || 65;
  const yourScore = results.your_score || 78;
  const overallScore = results.overall_score || Math.round((competitorScore + yourScore) / 2);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Tabs defaultValue="seo-report" className="w-full">
        <div className="border-b border-border px-4 py-2 flex items-center justify-between">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="scan" className="text-xs data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2">
              Scan Website
            </TabsTrigger>
            <TabsTrigger value="seo-analysis" className="text-xs data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2">
              SEO Analysis
            </TabsTrigger>
            <TabsTrigger value="seo-report" className="text-xs data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2">
              SEO Report
            </TabsTrigger>
          </TabsList>
          {!isPublic && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={onLivePreview}>
              Live Preview
            </Button>
          )}
        </div>

        {/* Scan Website Tab */}
        <TabsContent value="scan" className="m-0 p-6 space-y-6">
          <div className="text-center space-y-3">
            <Globe className="h-10 w-10 mx-auto" style={{ color: primaryColor }} />
            {settings.show_headline && (
              <h2 className={`font-bold text-foreground ${headlineSizeClass[settings.headline_size]}`}>
                {settings.headline_text}
              </h2>
            )}
            {settings.show_subheadline && (
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{settings.subheadline_text}</p>
            )}
            <div className="flex gap-2 max-w-sm mx-auto">
              <Input placeholder="Enter website URL..." className="text-sm" disabled />
              <Button size="icon" disabled style={{ backgroundColor: primaryColor }}>
                <Search className="h-4 w-4 text-foreground" />
              </Button>
            </div>
          </div>

          {!settings.hide_blurbs && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Search, title: "SEO Analyzer", desc: "Check website SEO performance" },
                { icon: Globe, title: "Business Scanner", desc: "Evaluate business visibility" },
                { icon: FileText, title: "AI Checklist", desc: "Personalized optimization steps" },
              ].map((b) => (
                <div key={b.title} className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
                  <b.icon className="h-4 w-4" style={{ color: primaryColor }} />
                  <p className="text-xs font-bold text-foreground">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SEO Analysis Tab */}
        <TabsContent value="seo-analysis" className="m-0 p-6 space-y-6">
          {settings.show_headline && (
            <div className="text-center">
              <h2 className={`font-bold text-foreground ${headlineSizeClass[settings.headline_size]}`}>
                SEO Analysis
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{domain}</p>
            </div>
          )}

          {/* Overall Score Gauge */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-28 w-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={primaryColor}
                  strokeWidth="8"
                  strokeDasharray={`${overallScore * 2.64} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{overallScore}</span>
                <span className="text-[10px] text-muted-foreground">/100</span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">Overall SEO Score</Badge>
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "On-Page SEO", score: 72, color: "hsl(var(--success))" },
              { label: "Technical", score: 68, color: "hsl(var(--info))" },
              { label: "Content", score: 81, color: primaryColor },
              { label: "Authority", score: 55, color: accentColor },
            ].map((cat) => (
              <div key={cat.label} className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">{cat.label}</p>
                <Progress value={cat.score} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground font-mono">{cat.score}/100</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* SEO Report Tab */}
        <TabsContent value="seo-report" className="m-0 p-6 space-y-6">
          {settings.show_headline && (
            <div className="text-center space-y-1">
              <h2 className={`font-bold text-foreground ${headlineSizeClass[settings.headline_size]}`}>
                SEO Report
              </h2>
              <p className="text-sm text-muted-foreground">{domain}</p>
            </div>
          )}

          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Competitor</p>
              <p className="text-[10px] text-muted-foreground font-mono">{domain}</p>
              <Progress value={competitorScore} className="h-2" />
              <p className="text-xs font-mono text-foreground">{competitorScore}/100</p>
            </div>
            <div className="rounded-lg border border-border p-4 space-y-2" style={{ borderColor: primaryColor + "40" }}>
              <p className="text-xs font-semibold text-foreground">Your Website</p>
              <p className="text-[10px] text-muted-foreground font-mono">Your content</p>
              <Progress value={yourScore} className="h-2" />
              <p className="text-xs font-mono text-foreground">{yourScore}/100</p>
            </div>
          </div>

          {/* Content Gap Analysis */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Content Gap Analysis</h3>
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {results.summary || "Comprehensive analysis of content gaps between your site and competitors."}
              </p>
              {strengths.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Key Opportunities</p>
                  {strengths.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                      <p className="text-xs text-muted-foreground">{s}</p>
                    </div>
                  ))}
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Areas to Improve</p>
                  {weaknesses.map((w: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-warning shrink-0" />
                      <p className="text-xs text-muted-foreground">{w}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Landscape */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" style={{ color: primaryColor }} />
              Content Landscape
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                <p className="text-[10px] font-bold text-success mb-1.5">Core Topics</p>
                <ul className="space-y-0.5">
                  {(keywords.slice(0, 3) as any[]).map((kw: any, i: number) => (
                    <li key={i} className="text-[10px] text-muted-foreground truncate">
                      • {typeof kw === "string" ? kw : kw.keyword || kw}
                    </li>
                  ))}
                  {keywords.length === 0 && <li className="text-[10px] text-muted-foreground">No data</li>}
                </ul>
              </div>
              <div className="rounded-lg border border-info/20 bg-info/5 p-3">
                <p className="text-[10px] font-bold text-info mb-1.5">Well Covered</p>
                <ul className="space-y-0.5">
                  {schemas.slice(0, 3).map((s: string, i: number) => (
                    <li key={i} className="text-[10px] text-muted-foreground truncate">• {s}</li>
                  ))}
                  {schemas.length === 0 && <li className="text-[10px] text-muted-foreground">No schemas</li>}
                </ul>
              </div>
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                <p className="text-[10px] font-bold text-warning mb-1.5">Gaps</p>
                <ul className="space-y-0.5">
                  {(keywords.slice(3, 6) as any[]).map((kw: any, i: number) => (
                    <li key={i} className="text-[10px] text-muted-foreground truncate">
                      • {typeof kw === "string" ? kw : kw.keyword || kw}
                    </li>
                  ))}
                  {keywords.length <= 3 && <li className="text-[10px] text-muted-foreground">Limited data</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Top Keywords */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Tag className="h-4 w-4" style={{ color: primaryColor }} />
              Estimated Top Keywords
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {keywords.length > 0 ? keywords.slice(0, 12).map((kw: any, i: number) => (
                <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0.5">
                  {typeof kw === "string" ? kw : kw.keyword || kw}
                </Badge>
              )) : (
                <p className="text-[10px] text-muted-foreground">No keywords detected</p>
              )}
            </div>
          </div>

          {/* Meta Patterns */}
          {(metaPatterns.title || metaPatterns.description) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4" style={{ color: primaryColor }} />
                Meta Tag Patterns
              </h3>
              <div className="rounded-lg border border-border p-4 space-y-2">
                {metaPatterns.title && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Title</p>
                    <p className="text-xs text-foreground">{metaPatterns.title}</p>
                  </div>
                )}
                {metaPatterns.description && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                    <p className="text-xs text-foreground">{metaPatterns.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA Blocks */}
          {enabledCtas.length > 0 && (
            <div className="space-y-3">
              {enabledCtas.map((cta) => (
                <div
                  key={cta.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                  style={{ borderLeftWidth: 4, borderLeftColor: primaryColor }}
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{cta.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cta.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-[10px] h-7 shrink-0">
                    {cta.button_text} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          {settings.show_disclaimer && settings.disclaimer_text && (
            <p className="text-[10px] text-muted-foreground text-center pt-4 border-t border-border">
              {settings.disclaimer_text}
            </p>
          )}

          {/* Legal Links */}
          {settings.show_legal_links && (
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
              <a href="/terms" className="hover:text-foreground">Terms of Service</a>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportPreview;
