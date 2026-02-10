import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { contentItemId, webhookUrl } = await req.json();
    if (!contentItemId) {
      return new Response(JSON.stringify({ error: "contentItemId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch the content item
    const { data: item, error: itemError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentItemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (itemError || !item) {
      return new Response(JSON.stringify({ error: "Content item not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Publishing",
      agent_description: "Ships content to CMS and triggers indexing",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const payload = {
      title: item.title,
      seo_title: item.seo_title,
      meta_description: item.meta_description,
      slug: item.slug,
      content: item.draft_content,
      keyword: item.keyword,
      schema_types: item.schema_types,
      published_at: new Date().toISOString(),
    };

    let webhookResult: any = { status: "no_webhook_configured" };

    // If webhook URL is provided, POST to it
    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        webhookResult = {
          status: webhookResponse.status,
          ok: webhookResponse.ok,
          body: await webhookResponse.text(),
        };
      } catch (webhookErr) {
        webhookResult = { status: "error", error: String(webhookErr) };
      }
    }

    // Update content item to published
    const publishUrl = `/blog/${item.slug || item.id}`;
    await supabase.from("content_items").update({
      status: "published",
      url: publishUrl,
    }).eq("id", contentItemId).eq("user_id", userId);

    await supabase.from("agent_runs").update({
      status: "completed",
      items_processed: 1,
      completed_at: new Date().toISOString(),
      result: { webhook_result: webhookResult, url: publishUrl },
    }).eq("id", run?.id);

    return new Response(JSON.stringify({ success: true, url: publishUrl, webhook_result: webhookResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("publish-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
