import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Globe } from "lucide-react";
import ReportPreview from "@/components/ReportPreview";
import SupportChat from "@/components/SupportChat";

const defaultSettings = {
  headline_text: "Your SEO Report",
  headline_size: "medium",
  subheadline_text: "See how your website performs across key SEO metrics",
  show_headline: true,
  show_subheadline: true,
  hide_blurbs: false,
  show_legal_links: true,
  show_disclaimer: true,
  disclaimer_text: "This report is generated automatically and may not reflect real-time data.",
  colors: { primary: "#6366f1", background: "#ffffff", accent: "#f59e0b" },
  cta_blocks: [],
};

const PublicReport = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [loading, setLoading] = useState(true);
  const [scan, setScan] = useState<any>(null);
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    // Use secure RPC that doesn't expose user_id or sensitive fields
    const { data: rawData, error: rpcError } = await supabase.rpc("get_public_report", {
      report_id: reportId,
    });

    const data = rawData as any;
    if (rpcError || !data || data.error) {
      setError("Report not found.");
      setLoading(false);
      return;
    }

    setScan(data.scan);

    if (data.settings) {
      setSettings({
        headline_text: data.settings.headline_text,
        headline_size: data.settings.headline_size,
        subheadline_text: data.settings.subheadline_text || "",
        show_headline: data.settings.show_headline,
        show_subheadline: data.settings.show_subheadline,
        hide_blurbs: data.settings.hide_blurbs,
        show_legal_links: data.settings.show_legal_links,
        show_disclaimer: data.settings.show_disclaimer,
        disclaimer_text: data.settings.disclaimer_text || "",
        colors: data.settings.colors || defaultSettings.colors,
        cta_blocks: data.settings.cta_blocks || [],
      });
    }
    setLoading(false);
  };

  const handleUnlock = async () => {
    if (!email.trim() || !email.includes("@")) return;
    setSubmitting(true);
    // Use edge function to capture lead without exposing user_id client-side
    await supabase.functions.invoke("report-lead-capture", {
      body: { scan_id: scan.id, email: email.trim() },
    });
    setUnlocked(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Email Gate
  if (!unlocked) {
    const primaryColor = settings.colors?.primary || "#6366f1";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-xl border border-border bg-card p-8 space-y-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6" style={{ color: primaryColor }} />
            </div>
            {settings.show_headline && (
              <h1 className="text-xl font-bold text-foreground">{settings.headline_text}</h1>
            )}
            {settings.show_subheadline && (
              <p className="text-sm text-muted-foreground">{settings.subheadline_text}</p>
            )}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Enter your email to view the full report</p>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              />
              <Button
                onClick={handleUnlock}
                disabled={submitting || !email.includes("@")}
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                View Report
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Your email will only be used to send you the report.
            </p>
          </div>
          {settings.show_legal_links && (
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
              <a href="/terms" className="hover:text-foreground">Terms of Service</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Unlocked: Show full report
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <ReportPreview settings={settings} scanData={scan} isPublic />
      </div>
      <SupportChat />
    </div>
  );
};

export default PublicReport;
