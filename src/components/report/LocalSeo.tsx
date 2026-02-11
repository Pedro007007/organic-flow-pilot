import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Star, CheckCircle2, XCircle } from "lucide-react";

interface LocalSeoProps {
  data: any;
  primaryColor: string;
}

const LocalSeo = ({ data, primaryColor }: LocalSeoProps) => {
  const local = data.local_seo || {};

  if (!local.applicable) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-foreground">Local SEO</h2>
          <p className="text-xs text-muted-foreground">Not applicable for this domain type</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-8 text-center">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Local SEO analysis is not applicable for this domain.</p>
        </div>
      </div>
    );
  }

  const checks = [
    { label: "Google Business Profile Optimized", value: local.gbp_optimized },
    { label: "NAP Consistency", value: local.nap_consistent },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">Local SEO</h2>
        <p className="text-xs text-muted-foreground">Local search visibility analysis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
          <Star className="h-5 w-5 mx-auto" style={{ color: "#f59e0b" }} />
          <p className="text-lg font-bold text-foreground">{local.average_rating || 0}</p>
          <p className="text-[10px] text-foreground/70">Avg Rating</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
          <p className="text-lg font-bold text-foreground">{local.reviews_count || 0}</p>
          <p className="text-[10px] text-foreground/70">Reviews</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
          <p className="text-lg font-bold text-foreground">{local.local_keyword_count || 0}</p>
          <p className="text-[10px] text-foreground/70">Local Keywords</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
          <p className="text-lg font-bold text-foreground">{local.local_visibility_score || 0}</p>
          <p className="text-[10px] text-foreground/70">Visibility Score</p>
        </div>
      </div>

      {/* Checks */}
      <div className="space-y-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2">
              {c.value ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
              <p className="text-xs text-foreground">{c.label}</p>
            </div>
            <Badge variant={c.value ? "secondary" : "destructive"} className="text-[10px]">{c.value ? "Pass" : "Fail"}</Badge>
          </div>
        ))}
      </div>

      {/* Visibility Score */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">Local Visibility Score</p>
        <Progress value={local.local_visibility_score || 0} className="h-3" />
      </div>
    </div>
  );
};

export default LocalSeo;
