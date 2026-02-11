import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Globe, FileText, Eye, BarChart3, Link2, MapPin, DollarSign, Rocket, Download, Loader2 } from "lucide-react";
import ExecutiveSummary from "./report/ExecutiveSummary";
import TechnicalAudit from "./report/TechnicalAudit";
import KeywordOpportunities from "./report/KeywordOpportunities";
import CompetitorGap from "./report/CompetitorGap";
import ContentAuthority from "./report/ContentAuthority";
import BacklinkProfile from "./report/BacklinkProfile";
import RevenueProjection from "./report/RevenueProjection";
import ActionPlan from "./report/ActionPlan";
import LocalSeo from "./report/LocalSeo";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const domain = scanData?.domain || "example.com";
  const primaryColor = settings.colors?.primary || "#6366f1";
  const accentColor = settings.colors?.accent || "#f59e0b";
  const enabledCtas = (settings.cta_blocks || []).filter((c) => c.enabled);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    setExporting(true);
    try {
      pdfRef.current.style.opacity = "1";

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#1a1a2e",
      });

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2;
      const imgTotalH = (canvas.height * contentW) / canvas.width;
      const totalPages = Math.ceil(imgTotalH / contentH);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        // Fill page background
        pdf.setFillColor(26, 26, 46);
        pdf.rect(0, 0, pageW, pageH, "F");
        // Slice strip from canvas
        const srcY = Math.round((page * contentH / imgTotalH) * canvas.height);
        const srcH = Math.round((contentH / imgTotalH) * canvas.height);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(srcH, canvas.height - srcY);
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#1a1a2e";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
        }
        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
        const sliceH = (sliceCanvas.height * contentW) / sliceCanvas.width;
        pdf.addImage(sliceData, "JPEG", margin, margin, contentW, sliceH);
      }

      pdf.save(`seo-report-${domain}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      if (pdfRef.current) pdfRef.current.style.opacity = "0";
      setExporting(false);
    }
  };

  const tabs = [
    { value: "overview", label: "Overview", icon: Eye },
    { value: "technical", label: "Technical", icon: Globe },
    { value: "keywords", label: "Keywords", icon: Search },
    { value: "competitors", label: "Competitors", icon: BarChart3 },
    { value: "content", label: "Content", icon: FileText },
    { value: "backlinks", label: "Backlinks", icon: Link2 },
    { value: "revenue", label: "Revenue", icon: DollarSign },
    { value: "action-plan", label: "Action Plan", icon: Rocket },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Tabs defaultValue="overview" className="w-full">
        {/* Tab Header */}
        <div className="border-b border-border px-3 py-2 flex items-center justify-between gap-2">
          <div className="overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 gap-0 flex-nowrap">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-[10px] data-[state=active]:bg-muted rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-2 gap-1 whitespace-nowrap"
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={handleDownloadPdf} disabled={exporting}>
              {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
              PDF
            </Button>
            {!isPublic && onLivePreview && (
              <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={onLivePreview}>
                Live Preview
              </Button>
            )}
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="m-0 p-6">
          {settings.show_headline && (
            <div className="text-center mb-6 space-y-1">
              <h2 className={`font-bold text-foreground ${headlineSizeClass[settings.headline_size]}`}>
                {settings.headline_text}
              </h2>
              {settings.show_subheadline && (
                <p className="text-sm text-muted-foreground">{settings.subheadline_text}</p>
              )}
            </div>
          )}
          <ExecutiveSummary data={results} domain={domain} primaryColor={primaryColor} accentColor={accentColor} />
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="m-0 p-6">
          <TechnicalAudit data={results} primaryColor={primaryColor} />
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="m-0 p-6">
          <KeywordOpportunities data={results} primaryColor={primaryColor} accentColor={accentColor} />
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="m-0 p-6">
          <CompetitorGap data={results} domain={domain} primaryColor={primaryColor} />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="m-0 p-6">
          <ContentAuthority data={results} primaryColor={primaryColor} />
        </TabsContent>

        {/* Backlinks Tab */}
        <TabsContent value="backlinks" className="m-0 p-6">
          <BacklinkProfile data={results} primaryColor={primaryColor} />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="m-0 p-6">
          <RevenueProjection data={results} primaryColor={primaryColor} accentColor={accentColor} />
        </TabsContent>

        {/* Action Plan Tab */}
        <TabsContent value="action-plan" className="m-0 p-6 space-y-6">
          <ActionPlan data={results} primaryColor={primaryColor} />

          {/* Local SEO section within action plan */}
          {results.local_seo?.applicable && (
            <>
              <div className="border-t border-border pt-6" />
              <LocalSeo data={results} primaryColor={primaryColor} />
            </>
          )}

          {/* CTA Blocks */}
          {enabledCtas.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
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
                  <Button size="sm" className="text-[10px] h-7 shrink-0" style={{ backgroundColor: primaryColor }}>
                    {cta.button_text}
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

          {settings.show_legal_links && (
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
              <a href="/terms" className="hover:text-foreground">Terms of Service</a>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Hidden PDF render target — seamless continuous layout */}
      <div
        ref={pdfRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ opacity: 0, zIndex: -1, fontFamily: "system-ui, sans-serif", width: "794px", backgroundColor: "#1a1a2e", color: "#ffffff" }}
      >
        <div style={{ padding: "40px 36px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#ffffff", margin: 0 }}>{settings.headline_text}</h1>
          {settings.show_subheadline && <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginTop: "6px" }}>{settings.subheadline_text}</p>}
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Report for {domain}</p>
          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", marginTop: "20px" }} />
        </div>
        <div style={{ padding: "12px 36px 20px" }}>
          <ExecutiveSummary data={results} domain={domain} primaryColor={primaryColor} accentColor={accentColor} />
        </div>
        <div style={{ padding: "12px 36px 20px" }}>
          <TechnicalAudit data={results} primaryColor={primaryColor} />
        </div>
        <div style={{ padding: "12px 36px 20px" }}>
          <KeywordOpportunities data={results} primaryColor={primaryColor} accentColor={accentColor} />
        </div>
        <div style={{ padding: "12px 36px 20px" }}>
          <CompetitorGap data={results} domain={domain} primaryColor={primaryColor} />
        </div>
        <div style={{ padding: "12px 36px 20px" }}>
          <ContentAuthority data={results} primaryColor={primaryColor} />
        </div>
        <div style={{ padding: "12px 36px 20px" }}>
          <BacklinkProfile data={results} primaryColor={primaryColor} />
        </div>
        <div style={{ padding: "12px 36px 20px" }}>
          <RevenueProjection data={results} primaryColor={primaryColor} accentColor={accentColor} />
        </div>
        <div style={{ padding: "12px 36px 20px" }}>
          <ActionPlan data={results} primaryColor={primaryColor} />
        </div>
        {results.local_seo?.applicable && (
          <div style={{ padding: "12px 36px 20px" }}>
            <LocalSeo data={results} primaryColor={primaryColor} />
          </div>
        )}
        {settings.show_disclaimer && settings.disclaimer_text && (
          <div style={{ padding: "16px 36px 32px", textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
            {settings.disclaimer_text}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPreview;
