import { Bot, CheckCircle2, Loader2, AlertCircle, Pause } from "lucide-react";
import type { AgentStatus } from "@/types/seo";

const statusConfig: Record<string, { icon: typeof Pause; color: string; bg: string; label: string; animate?: boolean }> = {
  idle: { icon: Pause, color: "text-muted-foreground", bg: "bg-muted", label: "Idle" },
  running: { icon: Loader2, color: "text-primary", bg: "bg-primary/10", label: "Running", animate: true },
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Done" },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Error" },
};

interface AgentPipelineProps {
  agents: AgentStatus[];
}

const AgentPipeline = ({ agents }: AgentPipelineProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Agent Pipeline</h2>
      </div>
      <div className="space-y-1">
        {agents.map((agent, i) => {
          const config = statusConfig[agent.status];
          const Icon = config.icon;
          return (
            <div key={agent.id} className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50">
              <div className="flex h-7 w-7 items-center justify-center">
                <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
              </div>
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${config.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${config.color} ${config.animate ? "animate-spin" : ""}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                {agent.lastRun && (
                  <p className="text-[10px] text-muted-foreground">{agent.lastRun}</p>
                )}
              </div>
              {i < agents.length - 1 && (
                <div className="absolute left-[2.85rem] mt-14 h-3 w-px bg-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentPipeline;
