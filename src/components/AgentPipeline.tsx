import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Bot, CheckCircle2, Loader2, AlertCircle, Pause, Play, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AgentStatus } from "@/types/seo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const statusConfig: Record<string, { icon: typeof Pause; color: string; bg: string; label: string; animate?: boolean }> = {
  idle: { icon: Pause, color: "text-muted-foreground", bg: "bg-muted", label: "Idle" },
  running: { icon: Loader2, color: "text-primary", bg: "bg-primary/10", label: "Running", animate: true },
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Done" },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Error" },
};

const agentFunctionMap: Record<string, string> = {
  "Keyword Discovery": "keyword-discovery",
  "SERP Research": "serp-research",
  "Content Strategy": "content-strategy",
  "Content Generation": "content-generate",
  "Image Generation": "generate-hero-image",
  "SEO Optimisation": "seo-optimize",
  "Publishing": "publish-webhook",
  "Monitoring & Refresh": "monitor-refresh",
};

interface AgentPipelineProps {
  agents: AgentStatus[];
}

const AgentPipeline = ({ agents }: AgentPipelineProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());

  const handleRunAgent = async (agent: AgentStatus) => {
    const fnName = agentFunctionMap[agent.name];
    if (!fnName) {
      toast({ title: "Unknown agent", variant: "destructive" });
      return;
    }

    setRunningAgents((prev) => new Set(prev).add(agent.name));

    try {
      // Build minimal body depending on agent
      let body: any = {};
      if (fnName === "keyword-discovery") {
        body = { gscData: [] }; // Will use existing data
      } else if (fnName === "monitor-refresh") {
        body = {};
      } else if (fnName === "content-strategy" || fnName === "serp-research") {
        // These need a keyword — fetch from the most recent keyword
        const { data: latestKw } = await supabase
          .from("keywords")
          .select("keyword, search_intent, supporting_keywords")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!latestKw) {
          toast({ title: "No keywords found", description: "Run Keyword Discovery first", variant: "destructive" });
          setRunningAgents((prev) => { const next = new Set(prev); next.delete(agent.name); return next; });
          return;
        }
        body = { keyword: latestKw.keyword, searchIntent: latestKw.search_intent, supportingKeywords: latestKw.supporting_keywords || [] };
      } else if (fnName === "seo-optimize" || fnName === "content-generate" || fnName === "generate-hero-image" || fnName === "publish-webhook") {
        // These agents require a contentItemId — fetch the most recent content item
        const { data: latestContent } = await supabase
          .from("content_items")
          .select("id, keyword")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!latestContent) {
          toast({ title: "No content items found", description: "Create a content item first", variant: "destructive" });
          setRunningAgents((prev) => { const next = new Set(prev); next.delete(agent.name); return next; });
          return;
        }
        body = { contentItemId: latestContent.id, keyword: latestContent.keyword };
      }

      const res = await supabase.functions.invoke(fnName, { body });
      if (res.error) throw res.error;
      toast({ title: `${agent.name} completed`, description: "Check results in the dashboard" });
    } catch (err: any) {
      toast({ title: `${agent.name} failed`, description: err.message, variant: "destructive" });
    } finally {
      setRunningAgents((prev) => {
        const next = new Set(prev);
        next.delete(agent.name);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Agent Pipeline</h2>
        </div>
        <div className="space-y-1">
          {agents.map((agent, i) => {
            const isRunning = runningAgents.has(agent.name) || agent.status === "running";
            const config = isRunning ? statusConfig.running : statusConfig[agent.status];
            const Icon = config.icon;
            const canRun = !isRunning && agentFunctionMap[agent.name];

            return (
              <div key={agent.id} className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50">
                <div className="flex h-7 w-7 items-center justify-center">
                  <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                </div>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${config.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color} ${config.animate || isRunning ? "animate-spin" : ""}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <span className={`text-xs font-medium ${config.color}`}>{isRunning ? "Running" : config.label}</span>
                    {agent.lastRun && (
                      <p className="text-[10px] text-muted-foreground">{agent.lastRun}</p>
                    )}
                  </div>
                  {canRun && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => handleRunAgent(agent)}
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works Guide */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/40 transition-colors group">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">How does the Agent Pipeline work?</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="rounded-lg border border-border bg-card mt-2 p-6 space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">🤖 What it does</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Agent Pipeline is a modular, SERP-informed automation system. Each agent handles one stage of the content lifecycle — from finding keywords to publishing optimized articles. You can run them individually or let them chain together.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">🔗 The 7 stages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "1. Keyword Discovery", desc: "Finds high-opportunity keywords from your niche and search console data" },
                { label: "2. SERP Research", desc: "Analyzes top-ranking competitors for each keyword to inform strategy" },
                { label: "3. Content Strategy", desc: "Generates outlines, angles, and structure based on competitor gaps" },
                { label: "4. Content Generation", desc: "Writes full draft articles using research and strategy data" },
                { label: "5. Image Generation", desc: "Creates hero images for each content piece automatically" },
                { label: "6. SEO Optimisation", desc: "Scores and refines content for on-page SEO, readability, and AEO" },
                { label: "7. Publishing", desc: "Pushes finished content to your site via webhook integration" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">🎯 Status meanings</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Idle", desc: "Ready to run" },
                { label: "Running", desc: "Currently processing" },
                { label: "Done", desc: "Completed successfully" },
                { label: "Error", desc: "Failed — check logs" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">💡 Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
              <li><strong className="text-foreground">Run in order</strong> — Agents build on each other; start with Keyword Discovery first.</li>
              <li><strong className="text-foreground">Click ▶</strong> next to any idle agent to trigger it manually.</li>
              <li><strong className="text-foreground">Monitor & Refresh</strong> re-checks rankings and updates content performance data.</li>
              <li><strong className="text-foreground">Check results</strong> in the Content Pipeline and Rankings pages after agents finish.</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AgentPipeline;
