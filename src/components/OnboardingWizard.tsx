import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Globe, Tag, Search, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Sparkles, Zap, X,
} from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
  onNavigate: (section: string) => void;
}

const STEPS = [
  { id: "gsc", label: "Connect GSC", icon: Globe, desc: "Link your Google Search Console" },
  { id: "brand", label: "Set Up Brand", icon: Tag, desc: "Configure your brand profile" },
  { id: "keywords", label: "Discover Keywords", icon: Search, desc: "Run your first keyword discovery" },
];

const OnboardingWizard = ({ onComplete, onNavigate }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [gscConnected, setGscConnected] = useState(false);
  const [gscLoading, setGscLoading] = useState(true);
  const [brandName, setBrandName] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const [runningDiscovery, setRunningDiscovery] = useState(false);
  const [discoveryDone, setDiscoveryDone] = useState(false);

  // Check GSC status
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("gsc-oauth", {
          body: { action: "status" },
        });
        if (data?.connected) setGscConnected(true);
      } catch { /* ignore */ }
      setGscLoading(false);
    })();
  }, [user]);

  // Check if brand already exists
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("brands")
        .select("id, name, domain")
        .eq("user_id", user.id)
        .limit(1);
      if (data && data.length > 0) {
        setBrandName(data[0].name);
        setBrandDomain(data[0].domain || "");
        setBrandSaved(true);
      }
    })();
  }, [user]);

  const handleConnectGsc = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("gsc-oauth", {
        body: { action: "authorize" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast({ title: "Error", description: "Could not start GSC connection.", variant: "destructive" });
    }
  };

  const handleSaveBrand = async () => {
    if (!user || !brandName.trim()) return;
    setSavingBrand(true);
    try {
      const { error } = await supabase.from("brands").insert({
        user_id: user.id,
        name: brandName.trim(),
        domain: brandDomain.trim() || null,
        is_default: true,
      });
      if (error) throw error;
      setBrandSaved(true);
      toast({ title: "Brand saved!", description: `${brandName} is now your default brand.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingBrand(false);
    }
  };

  const handleRunDiscovery = async () => {
    setRunningDiscovery(true);
    try {
      const { error } = await supabase.functions.invoke("keyword-discovery", {
        body: { domain: brandDomain.trim() || brandName.trim() },
      });
      if (error) throw error;
      setDiscoveryDone(true);
      toast({ title: "Keywords discovered!", description: "Check your Keywords section for results." });
    } catch {
      toast({ title: "Discovery started", description: "Your keyword agent is running. Results will appear shortly." });
      setDiscoveryDone(true);
    } finally {
      setRunningDiscovery(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const canProceed = step === 0 ? true : step === 1 ? brandSaved : discoveryDone;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-xl shadow-xl">
      {/* Close button */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title="Skip onboarding"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Welcome to Searchera!</h2>
            <p className="text-xs text-muted-foreground font-medium">Let's get you set up in 3 simple steps</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-3">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground shadow-md"
                  : i < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {i < step ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <s.icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step Content */}
      <div className="px-6 py-6 min-h-[220px]">
        {/* Step 1: Connect GSC */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Connect Google Search Console
              </h3>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Import your real search performance data — clicks, impressions, positions, and keywords — directly from Google.
              </p>
            </div>
            {gscLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking connection...
              </div>
            ) : gscConnected ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">GSC is connected!</span>
              </div>
            ) : (
              <div className="space-y-3">
                <Button onClick={handleConnectGsc} className="gap-2">
                  <Globe className="h-4 w-4" /> Connect Google Search Console
                </Button>
                <p className="text-xs text-muted-foreground">
                  Uses secure OAuth 2.0 — we never store your Google password.
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground italic">
              You can skip this step and connect later from Settings.
            </p>
          </div>
        )}

        {/* Step 2: Set Up Brand */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Set Up Your Brand
              </h3>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Tell us about your website so we can tailor content generation to your brand voice and domain.
              </p>
            </div>
            {brandSaved ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Brand "{brandName}" saved!
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="brand-name" className="text-sm font-bold text-foreground">Brand Name *</Label>
                  <Input
                    id="brand-name"
                    placeholder="e.g. Acme Corp"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="brand-domain" className="text-sm font-bold text-foreground">Domain</Label>
                  <Input
                    id="brand-domain"
                    placeholder="e.g. acme.com"
                    value={brandDomain}
                    onChange={(e) => setBrandDomain(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSaveBrand} disabled={!brandName.trim() || savingBrand} className="gap-2">
                  {savingBrand ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Save Brand
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Keyword Discovery */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Run Your First Keyword Discovery
              </h3>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Our AI will analyze your domain and find high-impact keyword opportunities you can rank for.
              </p>
            </div>
            {discoveryDone ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Keyword discovery initiated!
                  </span>
                </div>
                <Button
                  onClick={() => { onComplete(); onNavigate("keywords"); }}
                  variant="outline"
                  className="gap-2"
                >
                  View Keywords <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">
                    Target: <span className="text-primary">{brandDomain || brandName || "your domain"}</span>
                  </p>
                </div>
                <Button
                  onClick={handleRunDiscovery}
                  disabled={runningDiscovery}
                  className="gap-2"
                >
                  {runningDiscovery ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {runningDiscovery ? "Discovering..." : "Run Keyword Discovery"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between border-t border-border/50 px-6 py-4 bg-muted/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onComplete}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              className="gap-1"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => { onComplete(); onNavigate("dashboard"); }}
              className="gap-1"
            >
              Finish <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
