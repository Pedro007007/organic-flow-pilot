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
import { Loader2, Save, Globe, Clock, Key, Mail } from "lucide-react";

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
  const [schedules, setSchedules] = useState<Record<string, string>>({});
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

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
      .update({ webhook_url: webhookUrl, agent_schedule: updatedSchedules })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
    }
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
          When content is approved, it will be POSTed as JSON to this URL (e.g. your Next.js API route).
        </p>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Webhook URL</Label>
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-site.com/api/publish"
            className="bg-background border-border text-sm font-mono"
          />
        </div>
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
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Google Search Console</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Connect your Google Search Console to automatically pull keyword and performance data.
          You can manually ingest GSC data by calling the <code className="font-mono text-primary/80">gsc-ingest</code> endpoint with your exported JSON.
        </p>
        <div className="rounded-md bg-muted/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Endpoint</p>
          <code className="text-xs font-mono text-foreground break-all">
            POST /functions/v1/gsc-ingest
          </code>
          <p className="text-[10px] text-muted-foreground mt-2">
            Send a JSON body with <code className="font-mono">rows</code> array containing GSC performance data (keys, clicks, impressions, position, ctr).
          </p>
        </div>
      </div>

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
