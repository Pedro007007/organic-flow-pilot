import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const KeywordMovers = () => {
  const { user } = useAuth();

  const { data: movers, isLoading } = useQuery({
    queryKey: ["keyword_movers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rankings")
        .select("keyword, position, previous_position, url, snapshot_date")
        .order("snapshot_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data?.length) return { gainers: [], losers: [] };

      // Deduplicate by keyword, keep latest
      const seen = new Map<string, typeof data[0]>();
      for (const r of data) {
        if (!seen.has(r.keyword)) seen.set(r.keyword, r);
      }

      const withChange = Array.from(seen.values())
        .filter((r) => r.position != null && r.previous_position != null)
        .map((r) => ({
          keyword: r.keyword,
          position: Number(r.position),
          previousPosition: Number(r.previous_position),
          change: Number(r.previous_position) - Number(r.position),
          url: r.url,
        }));

      const gainers = withChange.filter((r) => r.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
      const losers = withChange.filter((r) => r.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);

      return { gainers, losers };
    },
  });

  if (isLoading) return null;
  if (!movers?.gainers.length && !movers?.losers.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MoverCard title="Top Gainers" icon={TrendingUp} items={movers?.gainers || []} positive />
      <MoverCard title="Top Losers" icon={TrendingDown} items={movers?.losers || []} positive={false} />
    </div>
  );
};

function MoverCard({
  title,
  icon: Icon,
  items,
  positive,
}: {
  title: string;
  icon: any;
  items: { keyword: string; position: number; change: number }[];
  positive: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.01] via-transparent to-transparent pointer-events-none" />
      <div className="border-b border-border/30 px-5 py-4 flex items-center gap-2 relative z-10">
        <Icon className={`h-4 w-4 ${positive ? "text-emerald-400" : "text-red-400"}`} />
        <h3 className="text-sm font-bold text-foreground tracking-wide">{title}</h3>
      </div>
      <div className="p-4 space-y-2 relative z-10">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet</p>
        ) : (
          items.map((item) => (
            <div key={item.keyword} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-foreground truncate max-w-[60%]">{item.keyword}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">#{item.position}</span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] font-mono ${
                    positive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {positive ? "↑" : "↓"} {Math.abs(item.change)}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KeywordMovers;
