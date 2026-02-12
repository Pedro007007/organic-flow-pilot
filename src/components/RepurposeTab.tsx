import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, RefreshCw, Linkedin, Youtube, Twitter, Check } from "lucide-react";

interface RepurposeTabProps {
  contentItemId: string;
}

type Channel = "linkedin" | "youtube" | "twitter";

interface RepurposedItem {
  id: string;
  channel: Channel;
  output: string | null;
  status: string;
  created_at: string;
}

const channelConfig: Record<Channel, { label: string; icon: typeof Linkedin; color: string }> = {
  linkedin: { label: "LinkedIn Post", icon: Linkedin, color: "text-[hsl(210,80%,45%)]" },
  youtube: { label: "YouTube Description", icon: Youtube, color: "text-destructive" },
  twitter: { label: "Twitter/X Thread", icon: Twitter, color: "text-primary" },
};

const RepurposeTab = ({ contentItemId }: RepurposeTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<RepurposedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Channel | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("repurposed_content" as any)
      .select("*")
      .eq("content_item_id", contentItemId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as any as RepurposedItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [contentItemId, user]);

  const handleGenerate = async (channel: Channel) => {
    setGenerating(channel);
    try {
      const res = await supabase.functions.invoke("content-repurpose", {
        body: { contentItemId, channel },
      });
      if (res.error) {
        const msg = res.error?.message || "Generation failed";
        // Try to parse JSON body for specific error
        try {
          const body = await (res.error as any).context?.json?.();
          if (body?.error) throw new Error(body.error);
        } catch {}
        throw new Error(msg);
      }
      toast({ title: `${channelConfig[channel].label} generated` });
      await fetchItems();
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const getLatest = (channel: Channel): RepurposedItem | undefined =>
    items.find((i) => i.channel === channel && i.status === "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground">Multi-Channel Repurposing</h3>
        <p className="text-xs text-muted-foreground">Transform your content into platform-specific formats with AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["linkedin", "youtube", "twitter"] as Channel[]).map((channel) => {
          const config = channelConfig[channel];
          const Icon = config.icon;
          const latest = getLatest(channel);
          const isGenerating = generating === channel;

          return (
            <Card key={channel} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <CardTitle className="text-sm">{config.label}</CardTitle>
                  </div>
                  {latest && (
                    <Badge variant="outline" className="text-[10px] text-success border-success/30">
                      Generated
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {latest?.output ? (
                  <>
                    <div className="max-h-48 overflow-y-auto rounded-md bg-muted/50 p-3 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                      {latest.output}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(latest.output!, latest.id)}
                        className="h-7 text-xs gap-1.5 flex-1"
                      >
                        {copied === latest.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === latest.id ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerate(channel)}
                        disabled={generating !== null}
                        className="h-7 text-xs gap-1.5 flex-1"
                      >
                        {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Regenerate
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(channel)}
                    disabled={generating !== null}
                    className="w-full h-8 text-xs gap-1.5"
                  >
                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
                    {isGenerating ? "Generating..." : `Generate ${config.label}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RepurposeTab;
