import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle } from "lucide-react";

interface TechnicalAuditProps {
  data: any;
  primaryColor: string;
}

const priorityStyles: Record<string, { color: string; label: string }> = {
  Urgent: { color: "hsl(var(--destructive))", label: "Urgent" },
  Fix: { color: "hsl(var(--warning))", label: "Fix" },
  Recommended: { color: "hsl(var(--info))", label: "Recommended" },
  OK: { color: "hsl(var(--success))", label: "OK" },
};

const TechnicalAudit = ({ data, primaryColor }: TechnicalAuditProps) => {
  const items = data.technical_audit || [];

  const getIcon = (priority: string) => {
    switch (priority) {
      case "OK": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "Urgent": return <XCircle className="h-4 w-4 text-destructive" />;
      case "Fix": return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <MinusCircle className="h-4 w-4 text-info" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">Technical SEO Audit</h2>
        <p className="text-xs text-muted-foreground">Core infrastructure health check</p>
      </div>

      {items.length > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 px-4 py-2.5 border-b border-border">
            <span>Element</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-16 text-center">Impact</span>
            <span className="w-20 text-center">Priority</span>
          </div>
          <div className="divide-y divide-border">
            {items.map((item: any, i: number) => {
              const ps = priorityStyles[item.priority] || priorityStyles.Recommended;
              return (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-0 items-center px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2">
                    {getIcon(item.priority)}
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.element}</p>
                      {item.details && <p className="text-[10px] text-muted-foreground mt-0.5">{item.details}</p>}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-foreground w-20 text-center">{item.status}</span>
                  <Badge variant="secondary" className="text-[9px] w-16 justify-center">{item.impact}</Badge>
                  <Badge className="text-[9px] w-20 justify-center" style={{ backgroundColor: ps.color }}>{ps.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No technical audit data available. Run a scan to analyze.</p>
      )}
    </div>
  );
};

export default TechnicalAudit;
