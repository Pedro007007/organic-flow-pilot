import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TopPagesPerformance = () => {
  const { user } = useAuth();

  const { data: pages, isLoading } = useQuery({
    queryKey: ["top_pages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("title, url, clicks, impressions, position, status")
        .in("status", ["published", "monitoring"])
        .order("clicks", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).filter((p) => p.clicks || p.impressions);
    },
  });

  if (isLoading || !pages?.length) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.01] via-transparent to-transparent pointer-events-none" />
      <div className="border-b border-border/30 px-5 py-4 flex items-center gap-2 relative z-10">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground tracking-wide">Top Performing Pages</h3>
        <Badge variant="outline" className="ml-auto text-[10px]">{pages.length} pages</Badge>
      </div>
      <div className="relative z-10 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground">
              <th className="px-5 py-3 text-left font-medium">Page</th>
              <th className="px-3 py-3 text-right font-medium">Clicks</th>
              <th className="px-3 py-3 text-right font-medium">Impressions</th>
              <th className="px-5 py-3 text-right font-medium">Avg Pos</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, i) => (
              <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3 text-foreground font-medium max-w-[250px] truncate">
                  {page.title}
                </td>
                <td className="px-3 py-3 text-right font-mono text-foreground">
                  {(page.clicks ?? 0).toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                  {(page.impressions ?? 0).toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                  {page.position ? Number(page.position).toFixed(1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopPagesPerformance;
