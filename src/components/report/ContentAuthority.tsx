import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface ContentAuthorityProps {
  data: any;
  primaryColor: string;
}

const ContentAuthority = ({ data, primaryColor }: ContentAuthorityProps) => {
  const review = data.content_review || {};

  const flags = [
    { label: "Thin pages (< 500 words)", count: review.thin_pages_count || 0, icon: AlertTriangle, bad: true },
    { label: "Duplicate titles", count: review.duplicate_titles_count || 0, icon: XCircle, bad: true },
    { label: "Missing meta descriptions", count: review.missing_meta_count || 0, icon: AlertTriangle, bad: true },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">Content Authority Review</h2>
        <p className="text-xs text-muted-foreground">Content quality and structure analysis</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Pages", value: review.total_pages || 0 },
          { label: "Blog Posts", value: review.blog_posts || 0 },
          { label: "Internal Linking", value: `${review.internal_linking_score || 0}/100` },
          { label: "Freshness", value: review.content_freshness || "N/A" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center space-y-1">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-foreground/70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Content Issues */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">Content Issues Flagged</p>
        {flags.map((f) => (
          <div key={f.label} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <f.icon className={`h-4 w-4 ${f.count > 0 ? "text-warning" : "text-success"}`} />
              <p className="text-xs text-foreground">{f.label}</p>
            </div>
            <Badge variant={f.count > 0 ? "destructive" : "secondary"} className="text-[10px]">
              {f.count}
            </Badge>
          </div>
        ))}
      </div>

      {/* Topic Clusters */}
      {review.topic_clusters?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">Topic Clusters Identified</p>
          <div className="flex flex-wrap gap-1.5">
            {review.topic_clusters.map((cluster: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-[10px]">{cluster}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Internal Linking Score */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">Internal Linking Score</p>
        <Progress value={review.internal_linking_score || 0} className="h-3" />
        <p className="text-[10px] text-foreground/70">{review.internal_linking_score || 0}/100 — {(review.internal_linking_score || 0) >= 60 ? "Good internal link structure" : "Internal linking needs improvement"}</p>
      </div>
    </div>
  );
};

export default ContentAuthority;
