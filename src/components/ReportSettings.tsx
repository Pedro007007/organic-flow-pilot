import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Palette, Type, MousePointerClick, Eye, Users } from "lucide-react";
import ReportPreview from "./ReportPreview";

interface CtaBlock {
  id: string;
  title: string;
  description: string;
  button_text: string;
  redirect_url: string;
  enabled: boolean;
}

interface ReportSettingsData {
  id?: string;
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
  cta_blocks: CtaBlock[];
}

const defaultSettings: ReportSettingsData = {
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
  cta_blocks: [
    { id: "competitor", title: "Competitor Analysis", description: "See how you stack up against competitors", button_text: "Learn More", redirect_url: "", enabled: true },
    { id: "content", title: "Content Strategy Insights", description: "Get actionable content recommendations", button_text: "Get Started", redirect_url: "", enabled: true },
    { id: "traffic", title: "Traffic and Performance", description: "Understand your traffic patterns", button_text: "View Details", redirect_url: "", enabled: true },
    { id: "seasonal", title: "Seasonal SEO Trends", description: "Capitalize on seasonal search trends", button_text: "Explore", redirect_url: "", enabled: false },
  ],
};

const ReportSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ReportSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sampleScan, setSampleScan] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadSettings();
    loadSampleScan();
    loadLeads();
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("report_settings")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      setSettings({
        id: data.id,
        headline_text: data.headline_text,
        headline_size: data.headline_size,
        subheadline_text: data.subheadline_text || "",
        show_headline: data.show_headline,
        show_subheadline: data.show_subheadline,
        hide_blurbs: data.hide_blurbs,
        show_legal_links: data.show_legal_links,
        show_disclaimer: data.show_disclaimer,
        disclaimer_text: data.disclaimer_text || "",
        colors: (data.colors as any) || defaultSettings.colors,
        cta_blocks: (data.cta_blocks as any) || defaultSettings.cta_blocks,
      });
    }
    setLoading(false);
  };

  const loadSampleScan = async () => {
    const { data } = await supabase
      .from("competitor_scans")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSampleScan(data);
  };

  const loadLeads = async () => {
    const { data } = await supabase
      .from("report_leads")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setLeads(data || []);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      headline_text: settings.headline_text,
      headline_size: settings.headline_size,
      subheadline_text: settings.subheadline_text,
      show_headline: settings.show_headline,
      show_subheadline: settings.show_subheadline,
      hide_blurbs: settings.hide_blurbs,
      show_legal_links: settings.show_legal_links,
      show_disclaimer: settings.show_disclaimer,
      disclaimer_text: settings.disclaimer_text,
      colors: settings.colors as any,
      cta_blocks: settings.cta_blocks as any,
    };

    let error;
    if (settings.id) {
      ({ error } = await supabase.from("report_settings").update(payload).eq("id", settings.id));
    } else {
      const { data, error: e } = await supabase.from("report_settings").insert(payload).select().single();
      error = e;
      if (data) setSettings((s) => ({ ...s, id: data.id }));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved", description: "Your report settings have been updated." });
    }
  };

  const updateCta = (id: string, field: string, value: any) => {
    setSettings((s) => ({
      ...s,
      cta_blocks: s.cta_blocks.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Report Settings</h2>
          <p className="text-xs text-muted-foreground">Customize how your SEO reports appear to prospects</p>
        </div>
        <div className="flex items-center gap-2">
          {leads.length > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              {leads.length} leads captured
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Settings Panel */}
        <div className="space-y-4">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="content" className="text-xs gap-1">
                <Type className="h-3 w-3" /> Content
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs gap-1">
                <Palette className="h-3 w-3" /> Colors
              </TabsTrigger>
              <TabsTrigger value="cta" className="text-xs gap-1">
                <MousePointerClick className="h-3 w-3" /> Call to Action
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show SEO Status</Label>
                  <Switch checked={settings.show_headline} onCheckedChange={(v) => setSettings((s) => ({ ...s, show_headline: v }))} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Headline Text</Label>
                  <Input
                    value={settings.headline_text}
                    onChange={(e) => setSettings((s) => ({ ...s, headline_text: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Headline Size</Label>
                  <div className="flex gap-2">
                    {["small", "medium", "large"].map((size) => (
                      <Button
                        key={size}
                        variant={settings.headline_size === size ? "default" : "outline"}
                        size="sm"
                        className="text-xs capitalize flex-1"
                        onClick={() => setSettings((s) => ({ ...s, headline_size: size }))}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Subheadline Text</Label>
                  <Input
                    value={settings.subheadline_text}
                    onChange={(e) => setSettings((s) => ({ ...s, subheadline_text: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Subheadline</Label>
                  <Switch checked={settings.show_subheadline} onCheckedChange={(v) => setSettings((s) => ({ ...s, show_subheadline: v }))} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Hide Blurb Boxes</Label>
                  <Switch checked={settings.hide_blurbs} onCheckedChange={(v) => setSettings((s) => ({ ...s, hide_blurbs: v }))} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Legal Links</Label>
                  <Switch checked={settings.show_legal_links} onCheckedChange={(v) => setSettings((s) => ({ ...s, show_legal_links: v }))} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Disclaimer</Label>
                  <Switch checked={settings.show_disclaimer} onCheckedChange={(v) => setSettings((s) => ({ ...s, show_disclaimer: v }))} />
                </div>

                {settings.show_disclaimer && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Disclaimer Text</Label>
                    <Textarea
                      value={settings.disclaimer_text}
                      onChange={(e) => setSettings((s) => ({ ...s, disclaimer_text: e.target.value }))}
                      className="text-xs min-h-[60px]"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                {[
                  { key: "primary", label: "Primary Color" },
                  { key: "background", label: "Background Color" },
                  { key: "accent", label: "Accent Color" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs">{label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(settings.colors as any)[key]}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            colors: { ...s.colors, [key]: e.target.value },
                          }))
                        }
                        className="h-8 w-8 rounded cursor-pointer border border-border"
                      />
                      <Input
                        value={(settings.colors as any)[key]}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            colors: { ...s.colors, [key]: e.target.value },
                          }))
                        }
                        className="text-xs font-mono flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* CTA Tab */}
            <TabsContent value="cta" className="space-y-4 mt-4">
              {settings.cta_blocks.map((cta) => (
                <div key={cta.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{cta.title}</p>
                    <Switch checked={cta.enabled} onCheckedChange={(v) => updateCta(cta.id, "enabled", v)} />
                  </div>
                  {cta.enabled && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">CTA Title</Label>
                        <Input value={cta.title} onChange={(e) => updateCta(cta.id, "title", e.target.value)} className="text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Description</Label>
                        <Input value={cta.description} onChange={(e) => updateCta(cta.id, "description", e.target.value)} className="text-xs" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Button Text</Label>
                          <Input value={cta.button_text} onChange={(e) => updateCta(cta.id, "button_text", e.target.value)} className="text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Redirect Link</Label>
                          <Input value={cta.redirect_url} onChange={(e) => updateCta(cta.id, "redirect_url", e.target.value)} className="text-xs" placeholder="https://..." />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        {/* Right: Floating Sticky Preview */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold text-foreground">Live SEO Preview</p>
          </div>
          <div className="rounded-xl border border-border bg-card shadow-lg">
            <ReportPreview settings={settings} scanData={sampleScan} />
          </div>

          {/* Call to Action Preview */}
          {settings.cta_blocks.some((c) => c.enabled) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground text-center">Call to Action Preview</p>
              <div className="space-y-2">
                {settings.cta_blocks
                  .filter((c) => c.enabled)
                  .map((cta) => (
                    <div
                      key={cta.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">{cta.title}</p>
                        <p className="text-[10px] text-muted-foreground">{cta.description}</p>
                      </div>
                      <Button
                        size="sm"
                        className="text-[10px] h-7 shrink-0"
                        style={{ backgroundColor: settings.colors?.primary || "#6366f1" }}
                      >
                        {cta.button_text}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leads Table */}
      {leads.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Captured Leads ({leads.length})
            </h3>
          </div>
          <div className="divide-y divide-border">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{lead.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()} at {new Date(lead.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">Lead</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSettings;
