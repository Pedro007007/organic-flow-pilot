import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Target } from "lucide-react";

interface ActionPlanProps {
  data: any;
  primaryColor: string;
}

const ActionPlan = ({ data, primaryColor }: ActionPlanProps) => {
  const plan = data.action_plan || {};
  const phases = [
    { label: "30-Day Plan", icon: Clock, items: plan["30_day"] || [], color: "hsl(var(--warning))", description: "Fix technical blockers & quick wins" },
    { label: "60-Day Plan", icon: Target, items: plan["60_day"] || [], color: primaryColor, description: "Build authority & expand content" },
    { label: "90-Day Plan", icon: CheckCircle2, items: plan["90_day"] || [], color: "hsl(var(--success))", description: "Scale & optimize for conversion" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">AI Strategic Action Plan</h2>
        <p className="text-xs text-muted-foreground">Specific, actionable steps — not generic advice</p>
      </div>

      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.label} className="rounded-lg border-l-4 border border-border bg-card overflow-hidden" style={{ borderLeftColor: phase.color }}>
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <phase.icon className="h-4 w-4" style={{ color: phase.color }} />
                <div>
                  <p className="text-xs font-bold text-foreground">{phase.label}</p>
                  <p className="text-[10px] text-muted-foreground">{phase.description}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[9px]">{phase.items.length} actions</Badge>
            </div>
            <div className="divide-y divide-border">
              {phase.items.length > 0 ? phase.items.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <Badge variant="secondary" className="text-[9px] w-5 h-5 p-0 justify-center shrink-0 mt-0.5">{i + 1}</Badge>
                  <p className="text-xs text-foreground/80">{item}</p>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground px-4 py-3">No actions defined yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionPlan;
