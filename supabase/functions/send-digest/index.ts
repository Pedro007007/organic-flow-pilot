import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Gather last 24h activity
    const [agentRuns, publishedContent, newKeywords] = await Promise.all([
      supabase
        .from("agent_runs")
        .select("agent_name, status, items_processed, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", since)
        .order("completed_at", { ascending: false }),
      supabase
        .from("content_items")
        .select("title, status, url")
        .eq("user_id", user.id)
        .eq("status", "published")
        .gte("updated_at", since),
      supabase
        .from("keywords")
        .select("keyword, position, impressions")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("impressions", { ascending: false })
        .limit(10),
    ]);

    const digest = {
      generated_at: new Date().toISOString(),
      period: "last_24h",
      agent_runs: agentRuns.data || [],
      published_content: publishedContent.data || [],
      new_keywords: newKeywords.data || [],
      summary: `${(agentRuns.data || []).length} agent runs, ${(publishedContent.data || []).length} published, ${(newKeywords.data || []).length} new keywords`,
    };

    // Store as a notification for now (could be extended to email later)
    if ((agentRuns.data?.length || 0) + (publishedContent.data?.length || 0) + (newKeywords.data?.length || 0) > 0) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "info",
        title: "Daily Digest",
        message: digest.summary,
        metadata: digest,
      });
    }

    return new Response(JSON.stringify(digest), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
