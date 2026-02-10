import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Subscribes to realtime changes on agent_runs, content_items, and notifications
 * and auto-invalidates the relevant react-query caches.
 */
export function useRealtimeSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_runs", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["agent_runs", user.id] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content_items", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["content_items", user.id] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
