import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Tag,
  Pen,
  Search,
  Link2,
  Image,
  Star,
} from "lucide-react";

interface Brand {
  id: string;
  name: string;
  domain: string | null;
  tone_of_voice: string | null;
  writing_style: string | null;
  writing_preferences: any;
  seo_settings: any;
  image_defaults: any;
  internal_linking_config: any;
  research_depth: string | null;
  is_default: boolean | null;
  created_at: string;
}

const BrandManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchBrands();
  }, [user]);

  const fetchBrands = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Failed to load brands", description: error.message, variant: "destructive" });
    } else {
      setBrands(data || []);
      if (!selectedBrand && data?.length) {
        setSelectedBrand(data[0]);
      }
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newBrandName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("brands")
      .insert({ user_id: user.id, name: newBrandName.trim(), is_default: brands.length === 0 })
      .select()
      .single();

    setCreating(false);
    if (error) {
      toast({ title: "Failed to create brand", description: error.message, variant: "destructive" });
    } else {
      setBrands((prev) => [...prev, data]);
      setSelectedBrand(data);
      setNewBrandName("");
      toast({ title: "Brand created" });
    }
  };

  const handleSave = async () => {
    if (!selectedBrand) return;
    setSaving(true);
    const { error } = await supabase
      .from("brands")
      .update({
        name: selectedBrand.name,
        domain: selectedBrand.domain,
        tone_of_voice: selectedBrand.tone_of_voice,
        writing_style: selectedBrand.writing_style,
        writing_preferences: selectedBrand.writing_preferences,
        seo_settings: selectedBrand.seo_settings,
        image_defaults: selectedBrand.image_defaults,
        internal_linking_config: selectedBrand.internal_linking_config,
        research_depth: selectedBrand.research_depth,
        is_default: selectedBrand.is_default,
      })
      .eq("id", selectedBrand.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setBrands((prev) => prev.map((b) => (b.id === selectedBrand.id ? selectedBrand : b)));
      toast({ title: "Brand saved" });
    }
  };

  const handleDelete = async () => {
    if (!selectedBrand) return;
    const { error } = await supabase.from("brands").delete().eq("id", selectedBrand.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      const remaining = brands.filter((b) => b.id !== selectedBrand.id);
      setBrands(remaining);
      setSelectedBrand(remaining[0] || null);
      toast({ title: "Brand deleted" });
    }
  };

  const updateField = <K extends keyof Brand>(key: K, value: Brand[K]) => {
    if (!selectedBrand) return;
    setSelectedBrand({ ...selectedBrand, [key]: value });
  };

  const updateJsonField = (key: keyof Brand, subKey: string, value: any) => {
    if (!selectedBrand) return;
    const current = (selectedBrand[key] as any) || {};
    setSelectedBrand({ ...selectedBrand, [key]: { ...current, [subKey]: value } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Brand Selector + Create */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Your Brands</h3>
          </div>
          {selectedBrand && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBrand(b)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                selectedBrand?.id === b.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.name}
              {b.is_default && <Star className="ml-1 inline h-3 w-3 text-warning" />}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="New brand name…"
            className="bg-background border-border text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button size="sm" onClick={handleCreate} disabled={creating || !newBrandName.trim()}>
            {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            Add
          </Button>
        </div>
      </div>

      {/* Brand Editor Tabs */}
      {selectedBrand && (
        <div className="rounded-lg border border-border bg-card p-5">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="general" className="text-xs gap-1.5"><Tag className="h-3 w-3" /> General</TabsTrigger>
              <TabsTrigger value="voice" className="text-xs gap-1.5"><Pen className="h-3 w-3" /> Voice</TabsTrigger>
              <TabsTrigger value="seo" className="text-xs gap-1.5"><Search className="h-3 w-3" /> SEO</TabsTrigger>
              <TabsTrigger value="linking" className="text-xs gap-1.5"><Link2 className="h-3 w-3" /> Linking</TabsTrigger>
              <TabsTrigger value="images" className="text-xs gap-1.5"><Image className="h-3 w-3" /> Images</TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Brand Name</Label>
                <Input value={selectedBrand.name} onChange={(e) => updateField("name", e.target.value)} className="bg-background border-border text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Domain</Label>
                <Input value={selectedBrand.domain || ""} onChange={(e) => updateField("domain", e.target.value)} placeholder="example.com" className="bg-background border-border text-sm font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Research Depth</Label>
                <Select value={selectedBrand.research_depth || "standard"} onValueChange={(v) => updateField("research_depth", v)}>
                  <SelectTrigger className="bg-background border-border text-sm w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light (top 3 competitors)</SelectItem>
                    <SelectItem value="standard">Standard (top 5)</SelectItem>
                    <SelectItem value="deep">Deep (top 10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Default Brand</Label>
                <Switch checked={selectedBrand.is_default || false} onCheckedChange={(v) => updateField("is_default", v)} />
              </div>
            </TabsContent>

            {/* Voice & Style */}
            <TabsContent value="voice" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tone of Voice</Label>
                <Select value={selectedBrand.tone_of_voice || "professional"} onValueChange={(v) => updateField("tone_of_voice", v)}>
                  <SelectTrigger className="bg-background border-border text-sm w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Writing Style</Label>
                <Input value={selectedBrand.writing_style || ""} onChange={(e) => updateField("writing_style", e.target.value)} placeholder="e.g. expert, concise, practical" className="bg-background border-border text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Min Word Count</Label>
                <Input type="number" value={selectedBrand.writing_preferences?.min_word_count || 1500} onChange={(e) => updateJsonField("writing_preferences", "min_word_count", parseInt(e.target.value) || 1500)} className="bg-background border-border text-sm w-32" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Max Word Count</Label>
                <Input type="number" value={selectedBrand.writing_preferences?.max_word_count || 3000} onChange={(e) => updateJsonField("writing_preferences", "max_word_count", parseInt(e.target.value) || 3000)} className="bg-background border-border text-sm w-32" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Avoid AI Clichés</Label>
                <Switch checked={selectedBrand.writing_preferences?.avoid_cliches ?? true} onCheckedChange={(v) => updateJsonField("writing_preferences", "avoid_cliches", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">First-Person Voice</Label>
                <Switch checked={selectedBrand.writing_preferences?.first_person ?? false} onCheckedChange={(v) => updateJsonField("writing_preferences", "first_person", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Scannable Format (headers, bullets)</Label>
                <Switch checked={selectedBrand.writing_preferences?.scannable_format ?? true} onCheckedChange={(v) => updateJsonField("writing_preferences", "scannable_format", v)} />
              </div>
            </TabsContent>

            {/* SEO Settings */}
            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Meta Title Suffix</Label>
                <Input value={selectedBrand.seo_settings?.meta_title_suffix || ""} onChange={(e) => updateJsonField("seo_settings", "meta_title_suffix", e.target.value)} placeholder="e.g. | Brand Name" className="bg-background border-border text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Default Schema Types</Label>
                <Input value={(selectedBrand.seo_settings?.default_schema_types || []).join(", ")} onChange={(e) => updateJsonField("seo_settings", "default_schema_types", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} placeholder="Article, FAQPage" className="bg-background border-border text-sm" />
                <p className="text-[10px] text-muted-foreground">Comma-separated list of JSON-LD schema types</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Focus Search Intent</Label>
                <Select value={selectedBrand.seo_settings?.focus_search_intent || "informational"} onValueChange={(v) => updateJsonField("seo_settings", "focus_search_intent", v)}>
                  <SelectTrigger className="bg-background border-border text-sm w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="informational">Informational</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="navigational">Navigational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Target Position Min</Label>
                  <Input type="number" value={selectedBrand.seo_settings?.target_positions?.[0] || 8} onChange={(e) => updateJsonField("seo_settings", "target_positions", [parseInt(e.target.value) || 8, selectedBrand.seo_settings?.target_positions?.[1] || 30])} className="bg-background border-border text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Target Position Max</Label>
                  <Input type="number" value={selectedBrand.seo_settings?.target_positions?.[1] || 30} onChange={(e) => updateJsonField("seo_settings", "target_positions", [selectedBrand.seo_settings?.target_positions?.[0] || 8, parseInt(e.target.value) || 30])} className="bg-background border-border text-sm" />
                </div>
              </div>
            </TabsContent>

            {/* Internal Linking */}
            <TabsContent value="linking" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Enable Internal Linking</Label>
                <Switch checked={selectedBrand.internal_linking_config?.enabled ?? true} onCheckedChange={(v) => updateJsonField("internal_linking_config", "enabled", v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Max Internal Links per Article</Label>
                <Input type="number" value={selectedBrand.internal_linking_config?.max_links || 5} onChange={(e) => updateJsonField("internal_linking_config", "max_links", parseInt(e.target.value) || 5)} className="bg-background border-border text-sm w-32" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Prefer Sitemap Pages</Label>
                <Switch checked={selectedBrand.internal_linking_config?.prefer_sitemap ?? true} onCheckedChange={(v) => updateJsonField("internal_linking_config", "prefer_sitemap", v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Anchor Text Style</Label>
                <Select value={selectedBrand.internal_linking_config?.anchor_style || "natural"} onValueChange={(v) => updateJsonField("internal_linking_config", "anchor_style", v)}>
                  <SelectTrigger className="bg-background border-border text-sm w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural (contextual)</SelectItem>
                    <SelectItem value="exact">Exact Match Keyword</SelectItem>
                    <SelectItem value="branded">Branded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Image Defaults */}
            <TabsContent value="images" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Image Style</Label>
                <Input value={selectedBrand.image_defaults?.style || ""} onChange={(e) => updateJsonField("image_defaults", "style", e.target.value)} placeholder="e.g. modern, clean, minimalist" className="bg-background border-border text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Brand Color Palette</Label>
                <Input value={selectedBrand.image_defaults?.color_palette || ""} onChange={(e) => updateJsonField("image_defaults", "color_palette", e.target.value)} placeholder="e.g. blue, white, dark grey" className="bg-background border-border text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
                <Select value={selectedBrand.image_defaults?.aspect_ratio || "16:9"} onValueChange={(v) => updateJsonField("image_defaults", "aspect_ratio", v)}>
                  <SelectTrigger className="bg-background border-border text-sm w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Include Body Images</Label>
                <Switch checked={selectedBrand.image_defaults?.include_body_images ?? true} onCheckedChange={(v) => updateJsonField("image_defaults", "include_body_images", v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Body Image Count</Label>
                <Input type="number" value={selectedBrand.image_defaults?.body_image_count || 2} onChange={(e) => updateJsonField("image_defaults", "body_image_count", parseInt(e.target.value) || 2)} className="bg-background border-border text-sm w-32" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              Save Brand
            </Button>
          </div>
        </div>
      )}

      {!selectedBrand && brands.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
          <Tag className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No brands yet</p>
          <p className="text-xs text-muted-foreground">Create your first brand above to personalise your content pipeline.</p>
        </div>
      )}
    </div>
  );
};

export default BrandManagement;
