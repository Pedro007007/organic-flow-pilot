import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PerformanceMetric, KeywordOpportunity, ContentItem, AgentStatus } from "@/types/seo";


export function usePerformanceMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["performance_snapshots", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PerformanceMetric[]> => {
      const { data, error } = await supabase
        .from("performance_snapshots")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map((s) => ({
        label: s.label,
        value: s.value,
        change: Number(s.change),
        changeLabel: s.change_label,
      }));
    },
  });
}

export function useKeywords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["keywords", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<KeywordOpportunity[]> => {
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map((k) => ({
        id: k.id,
        keyword: k.keyword,
        searchIntent: k.search_intent as KeywordOpportunity["searchIntent"],
        impressions: k.impressions,
        clicks: k.clicks,
        ctr: Number(k.ctr),
        position: Number(k.position),
        opportunity: k.opportunity as KeywordOpportunity["opportunity"],
        contentType: k.content_type as KeywordOpportunity["contentType"],
        supportingKeywords: k.supporting_keywords || [],
      }));
    },
  });
}

export function useContentItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["content_items", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ContentItem[]> => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map((c) => ({
        id: c.id,
        title: c.title,
        keyword: c.keyword,
        status: c.status as ContentItem["status"],
        author: c.author,
        lastUpdated: c.updated_at.split("T")[0],
        impressions: c.impressions ?? undefined,
        clicks: c.clicks ?? undefined,
        position: c.position ? Number(c.position) : undefined,
        url: c.url ?? undefined,
        seoScore: c.seo_score ?? undefined,
      }));
    },
  });
}

export function useAgentRuns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agent_runs", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AgentStatus[]> => {
      const defaultAgents = [
        { name: "Keyword Discovery", description: "Identifies high-value keyword opportunities from GSC data" },
        { name: "Content Strategy", description: "Turns keywords into structured content plans" },
        { name: "Content Generation", description: "Writes human-quality, intent-based SEO content" },
        { name: "SEO Optimisation", description: "Finalises meta, schema, links for max visibility" },
        { name: "Publishing", description: "Ships content to CMS and triggers indexing" },
        { name: "Monitoring & Refresh", description: "Tracks performance and flags refresh opportunities" },
      ];

      const { data, error } = await supabase
        .from("agent_runs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return defaultAgents.map((agent, i) => ({
        id: String(i + 1),
        name: agent.name,
        description: agent.description,
        status: "idle" as const,
        lastRun: "never",
        itemsProcessed: 0,
      }));

      const agentMap = new Map<string, typeof data[0]>();
      for (const run of data) {
        if (!agentMap.has(run.agent_name)) {
          agentMap.set(run.agent_name, run);
        }
      }

      return defaultAgents.map((agent, i) => {
        const run = agentMap.get(agent.name);
        if (run) {
          const timeDiff = Date.now() - new Date(run.created_at).getTime();
          const lastRun = timeDiff < 60000 ? "just now" :
            timeDiff < 3600000 ? `${Math.floor(timeDiff / 60000)} min ago` :
            `${Math.floor(timeDiff / 3600000)}h ago`;

          return {
            id: run.id,
            name: agent.name,
            description: run.agent_description || agent.description,
            status: run.status as AgentStatus["status"],
            lastRun,
            itemsProcessed: run.items_processed ?? 0,
          };
        }
        return {
          id: String(i + 1),
          name: agent.name,
          description: agent.description,
          status: "idle" as const,
          lastRun: "never",
          itemsProcessed: 0,
        };
      });
    },
  });
}
