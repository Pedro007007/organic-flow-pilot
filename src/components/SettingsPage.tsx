import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Globe, Clock, Mail, ShieldCheck, Zap } from "lucide-react";
import GscConnectionCard from "@/components/GscConnectionCard";
import NextJsSetupGuide from "@/components/NextJsSetupGuide";

const agentNames = [
  { key: "keyword_discovery", label: "Keyword Discovery" },
  { key: "content_strategy", label: "Content Strategy" },
  { key: "content_generate", label: "Content Generation" },
  { key: "seo_optimize", label: "SEO Optimization" },
  { key: "publish_webhook", label: "Publishing" },
  { key: "monitor_refresh", label: "Monitoring & Refresh" },
];

const scheduleOptions = [
  { value: "manual", label: "Manual" },
  { value: "hourly", label: "Every Hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [revalidationPrefix, setRevalidationPrefix] = useState("/blog");
  const [schedules, setSchedules] = useState<Record<string, string>>({});
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setWebhookUrl(data.webhook_url || "");
        setWebhookSecret((data as any).webhook_secret || "");
        setRevalidationPrefix((data as any).revalidation_prefix || "/blog");
        const sched = (data.agent_schedule as Record<string, string>) || {};
        setSchedules(sched);
        setDigestEnabled(sched.daily_digest === "enabled");
      } else {
        const defaults = {
          keyword_discovery: "daily",
          content_strategy: "daily",
          content_generate: "manual",
          seo_optimize: "manual",
          publish_webhook: "manual",
          monitor_refresh: "weekly",
          daily_digest: "disabled",
        };
        setSchedules(defaults);
        await supabase.from("user_settings").insert({
          user_id: user.id,
          webhook_url: "",
          agent_schedule: defaults,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updatedSchedules = { ...schedules, daily_digest: digestEnabled ? "enabled" : "disabled" };
    const { error } = await supabase
      .from("user_settings")
      .update({
        webhook_url: webhookUrl,
        agent_schedule: updatedSchedules,
        webhook_secret: webhookSecret,
        revalidation_prefix: revalidationPrefix,
      } as any)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-webhook");
      if (error) {
        const errBody = await (error as any).context?.json?.() || {};
        toast({
          title: "Test failed",
          description: errBody.error || error.message,
          variant: "destructive",
        });
      } else if (data?.success) {
        toast({ title: "Connection successful", description: `Status: ${data.status} ${data.statusText}` });
      } else {
        toast({
          title: "Webhook responded with error",
          description: `Status: ${data?.status} — ${data?.body?.substring(0, 100) || "No body"}`,
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({ title: "Test failed", description: String(e), variant: "destructive" });
    }
    setTestingWebhook(false);
  };

  const handleSendDigest = async () => {
    setSendingDigest(true);
    const { data, error } = await supabase.functions.invoke("send-digest");
    setSendingDigest(false);
    if (error) {
      toast({ title: "Digest failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Digest sent", description: data?.summary || "Check notifications" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Webhook Config */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Publish Webhook</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          When content is approved, it will be POSTed as JSON to this URL (e.g. your Next.js API route) with ISR revalidation headers.
        </p>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Webhook URL</Label>
          <Input
            value={webhookUrl}
            onChange={(e) => {
              let val = e.target.value.trim();
              if (val && !val.startsWith("http://") && !val.startsWith("https://") && val.includes(".")) {
                val = "https://" + val;
              }
              setWebhookUrl(val);
            }}
            placeholder="https://your-site.com/api/publish"
            className="bg-background border-border text-sm font-mono"
          />
          {webhookUrl && !webhookUrl.includes("/api/") && (
            <p className="text-xs text-yellow-500">
              ⚠ URL doesn't contain an <code>/api/</code> path — make sure this points to your Next.js API route (e.g. <code>/api/publish</code>).
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> Webhook Secret
          </Label>
          <Input
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="A shared secret to verify requests on your Next.js side"
            className="bg-background border-border text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Revalidation Path Prefix</Label>
          <Input
            value={revalidationPrefix}
            onChange={(e) => setRevalidationPrefix(e.target.value)}
            placeholder="/blog"
            className="bg-background border-border text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Published content paths will be: <code className="text-primary">{revalidationPrefix}/{'<slug>'}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleTestWebhook} disabled={testingWebhook || !webhookUrl}>
            {testingWebhook ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
            Test Connection
          </Button>
        </div>

        <NextJsSetupGuide />
      </div>

      {/* Daily Digest */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Daily Digest</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Get a summary of agent runs, published content, and new keywords from the last 24 hours delivered as a notification.
        </p>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground">Enable Daily Digest</Label>
          <Switch checked={digestEnabled} onCheckedChange={setDigestEnabled} />
        </div>
        <Button size="sm" variant="outline" onClick={handleSendDigest} disabled={sendingDigest}>
          {sendingDigest ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-1.5 h-3.5 w-3.5" />}
          Send Digest Now
        </Button>
      </div>

      {/* Agent Schedules */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Agent Schedules</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure how frequently each agent runs automatically.
        </p>
        <div className="space-y-3">
          {agentNames.map((agent) => (
            <div key={agent.key} className="flex items-center justify-between">
              <Label className="text-sm text-foreground">{agent.label}</Label>
              <Select
                value={schedules[agent.key] || "manual"}
                onValueChange={(val) =>
                  setSchedules((prev) => ({ ...prev, [agent.key]: val }))
                }
              >
                <SelectTrigger className="w-36 bg-background border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* GSC Integration */}
      <GscConnectionCard />

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="mr-1.5 h-3.5 w-3.5" />
        )}
        Save Settings
      </Button>
    </div>
  );
};

export default SettingsPage;
