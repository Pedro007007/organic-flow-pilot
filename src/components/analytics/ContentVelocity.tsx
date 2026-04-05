import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STAGE_ORDER = ["discovery", "strategy", "writing", "optimizing", "unpublished", "published", "monitoring"];

const ContentVelocity = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["content_velocity", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from("content_items")
        .select("created_at, updated_at, status")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!items?.length) return null;

      // Average days from creation to current stage
      const stageAges: Record<string, number[]> = {};
      for (const item of items) {
        const days = Math.max(
          0,
          (new Date(item.updated_at).getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (!stageAges[item.status]) stageAges[item.status] = [];
        stageAges[item.status].push(days);
      }

      const velocityData = STAGE_ORDER
        .filter((s) => stageAges[s]?.length)
        .map((status) => {
          const ages = stageAges[status];
          const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
          return {
            stage: status.charAt(0).toUpperCase() + status.slice(1),
            avgDays: Math.round(avg * 10) / 10,
            count: ages.length,
          };
        });

      // Overall published speed
      const publishedItems = items.filter((i) => i.status === "published" || i.status === "monitoring");
      let avgPublishDays: number | null = null;
      if (publishedItems.length > 0) {
        const totalDays = publishedItems.reduce((acc, item) => {
          return acc + (new Date(item.updated_at).getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
        }, 0);
        avgPublishDays = Math.round((totalDays / publishedItems.length) * 10) / 10;
      }

      return { velocityData, avgPublishDays, total: items.length };
    },
  });

  if (isLoading || !data) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.01] via-transparent to-transparent pointer-events-none" />
      <div className="border-b border-border/30 px-5 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground tracking-wide">Content Velocity</h3>
        </div>
        {data.avgPublishDays != null && (
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-foreground">{data.avgPublishDays}d</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg to Publish</p>
          </div>
        )}
      </div>
      <div className="p-5 relative z-10">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.velocityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="stage"
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Days", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsla(220, 20%, 14%, 0.65)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid hsla(220, 20%, 40%, 0.25)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [`${value} days`, "Avg Time"]}
            />
            <Bar dataKey="avgDays" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ContentVelocity;
