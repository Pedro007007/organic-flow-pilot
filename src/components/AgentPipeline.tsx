import { useState } from "react";
import { Bot, CheckCircle2, Loader2, AlertCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AgentStatus } from "@/types/seo";

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
  );
};

export default AgentPipeline;
