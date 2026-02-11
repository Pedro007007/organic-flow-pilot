import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link2, ShieldAlert, TrendingUp } from "lucide-react";

interface BacklinkProfileProps {
  data: any;
  primaryColor: string;
}

const BacklinkProfile = ({ data, primaryColor }: BacklinkProfileProps) => {
  const bl = data.backlink_profile || {};
  const toxicRiskColor = bl.toxic_risk === "High" ? "hsl(var(--destructive))" : bl.toxic_risk === "Medium" ? "hsl(var(--warning))" : "hsl(var(--success))";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">Backlink Profile</h2>
        <p className="text-xs text-muted-foreground">Link authority and risk analysis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Backlinks", value: (bl.total_backlinks || 0).toLocaleString(), icon: Link2 },
          { label: "Referring Domains", value: (bl.referring_domains || 0).toLocaleString(), icon: TrendingUp },
          { label: "Toxic Risk", value: bl.toxic_risk || "N/A", icon: ShieldAlert, color: toxicRiskColor },
          { label: "Authority", value: bl.authority_comparison || "N/A", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4 text-center space-y-2">
            <s.icon className="h-5 w-5 mx-auto" style={{ color: s.color || primaryColor }} />
            <p className="text-sm font-bold text-foreground" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toxic Links */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">Toxic Links</p>
        <div className="flex items-center gap-3">
          <Progress value={bl.toxic_links_percentage || 0} className="h-2 flex-1" />
          <span className="text-xs font-mono text-foreground">{bl.toxic_links_percentage || 0}%</span>
        </div>
      </div>

      {/* Domains Needed */}
      <div className="rounded-lg border-l-4 p-4 bg-info/5" style={{ borderLeftColor: primaryColor }}>
        <p className="text-xs text-foreground">
          You need approximately <span className="font-bold">{bl.domains_needed || 0} new quality referring domains</span> to compete in your niche.
        </p>
      </div>

      {/* Top Referring */}
      {bl.top_referring?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">Top Referring Domains</p>
          <div className="space-y-1">
            {bl.top_referring.map((d: string, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded border border-border bg-muted/20 px-3 py-2">
                <Badge variant="secondary" className="text-[9px] w-5 h-5 p-0 justify-center shrink-0">{i + 1}</Badge>
                <p className="text-xs text-foreground/70 font-mono">{d}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BacklinkProfile;
