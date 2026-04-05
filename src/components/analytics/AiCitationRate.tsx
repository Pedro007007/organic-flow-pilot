import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const AiCitationRate = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["ai_citation_rate", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: citations, error } = await supabase
        .from("ai_citations")
        .select("cited, engine")
        .order("checked_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!citations?.length) return null;

      const total = citations.length;
      const cited = citations.filter((c) => c.cited).length;
      const rate = Math.round((cited / total) * 100);

      // By engine
      const engineMap = new Map<string, { cited: number; total: number }>();
      for (const c of citations) {
        const eng = engineMap.get(c.engine) || { cited: 0, total: 0 };
        eng.total++;
        if (c.cited) eng.cited++;
        engineMap.set(c.engine, eng);
      }

      const byEngine = Array.from(engineMap.entries()).map(([engine, stats]) => ({
        engine,
        rate: Math.round((stats.cited / stats.total) * 100),
        cited: stats.cited,
        total: stats.total,
      }));

      return { total, cited, rate, byEngine };
    },
  });

  if (isLoading || !data) return null;

  const pieData = [
    { name: "Cited", value: data.cited },
    { name: "Not Cited", value: data.total - data.cited },
  ];

  const COLORS = ["hsl(152, 70%, 50%)", "hsl(220, 15%, 25%)"];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.01] via-transparent to-transparent pointer-events-none" />
      <div className="border-b border-border/30 px-5 py-4 flex items-center gap-2 relative z-10">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground tracking-wide">AI Citation Rate</h3>
      </div>
      <div className="p-5 relative z-10">
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsla(220, 20%, 14%, 0.65)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid hsla(220, 20%, 40%, 0.25)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            <div>
              <p className="text-3xl font-bold text-foreground font-mono">{data.rate}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Citation Rate</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.cited} of {data.total} URLs cited by AI engines
            </p>
          </div>
        </div>

        {data.byEngine.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
            {data.byEngine.map((eng) => (
              <div key={eng.engine} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground capitalize">{eng.engine}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${eng.rate}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground w-8 text-right">{eng.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiCitationRate;
