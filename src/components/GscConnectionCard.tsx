import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Key, Loader2, RefreshCw, Unlink, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

const GscConnectionCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("gsc-oauth", {
        body: { action: "status" },
      });
      if (!error && data) {
        setConfigured(data.configured);
        setConnected(data.connected);
        setSiteUrl(data.site_url);
        setConnectedAt(data.connected_at);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const gscCallback = params.get("gsc_callback");

    if (code && gscCallback === "true") {
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      handleExchangeCode(code);
    }
  }, []);

  const handleExchangeCode = async (code: string) => {
    setConnecting(true);
    const redirectUri = `${window.location.origin}${window.location.pathname}?gsc_callback=true`;
    const { data, error } = await supabase.functions.invoke("gsc-oauth", {
      body: { action: "exchange_code", code, redirect_uri: redirectUri },
    });
    setConnecting(false);
    if (error || !data?.success) {
      toast({ title: "Connection failed", description: error?.message || data?.error || "Unknown error", variant: "destructive" });
    } else {
      toast({ title: "Google Search Console connected!", description: data.site_url || "Ready to sync" });
      fetchStatus();
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    const redirectUri = `${window.location.origin}${window.location.pathname}?gsc_callback=true`;
    const { data, error } = await supabase.functions.invoke("gsc-oauth", {
      body: { action: "get_auth_url", redirect_uri: redirectUri },
    });
    setConnecting(false);
    if (error || !data?.url) {
      toast({ title: "Failed to start connection", description: error?.message || data?.error, variant: "destructive" });
    } else {
      window.location.href = data.url;
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("gsc-oauth", {
      body: { action: "sync" },
    });
    setSyncing(false);
    if (error || !data?.success) {
      toast({ title: "Sync failed", description: error?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "GSC data synced", description: `${data.keywords_created} keywords, ${data.snapshots_created} snapshots` });
    }
  };

  const handleDisconnect = async () => {
    const { error } = await supabase.functions.invoke("gsc-oauth", {
      body: { action: "disconnect" },
    });
    if (error) {
      toast({ title: "Disconnect failed", description: error.message, variant: "destructive" });
    } else {
      setConnected(false);
      setSiteUrl(null);
      setConnectedAt(null);
      toast({ title: "Disconnected from Google Search Console" });
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading GSC status…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Key className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Google Search Console</h3>
      </div>

      {!configured && (
        <>
          <div className="flex items-start gap-2 rounded-md bg-muted/50 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">
                GSC integration requires <code className="font-mono text-primary/80">GSC_CLIENT_ID</code> and{" "}
                <code className="font-mono text-primary/80">GSC_CLIENT_SECRET</code> secrets to be configured.
                These come from your Google Cloud Console OAuth 2.0 credentials.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            You can still manually ingest GSC data by calling the <code className="font-mono text-primary/80">gsc-ingest</code> endpoint with your exported JSON.
          </p>
        </>
      )}

      {configured && !connected && (
        <>
          <p className="text-xs text-muted-foreground">
            Connect your Google Search Console to automatically pull keyword and performance data.
          </p>
          <Button size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            )}
            Connect Google Search Console
          </Button>
        </>
      )}

      {configured && connected && (
        <>
          <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Connected</p>
              {siteUrl && <p className="text-xs text-muted-foreground font-mono mt-0.5">{siteUrl}</p>}
              {connectedAt && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Since {new Date(connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Sync Now
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDisconnect} className="text-muted-foreground">
              <Unlink className="mr-1.5 h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default GscConnectionCard;
