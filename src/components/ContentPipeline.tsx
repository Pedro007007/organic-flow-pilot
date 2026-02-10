import { FileText, ExternalLink } from "lucide-react";
import type { ContentItem } from "@/types/seo";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  discovery: { label: "Discovery", color: "text-info", bg: "bg-info/15 border-info/20" },
  strategy: { label: "Strategy", color: "text-warning", bg: "bg-warning/15 border-warning/20" },
  writing: { label: "Writing", color: "text-primary", bg: "bg-primary/15 border-primary/20" },
  optimizing: { label: "Optimizing", color: "text-warning", bg: "bg-warning/15 border-warning/20" },
  published: { label: "Published", color: "text-success", bg: "bg-success/15 border-success/20" },
  monitoring: { label: "Monitoring", color: "text-success", bg: "bg-success/15 border-success/20" },
};

interface ContentPipelineProps {
  content: ContentItem[];
}

const ContentPipeline = ({ content }: ContentPipelineProps) => {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Content Pipeline</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Track content through all agent stages</p>
      </div>
      <div className="divide-y divide-border/50">
        {content.map((item) => {
          const config = statusConfig[item.status];
          return (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{item.keyword}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground">{item.lastUpdated}</span>
                </div>
              </div>
              <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              {item.status === "published" && item.position && (
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-mono text-xs text-foreground">#{item.position}</p>
                    <p className="text-[10px] text-muted-foreground">rank</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-foreground">{item.clicks?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">clicks</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContentPipeline;
