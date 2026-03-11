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

    // Get user settings
    const { data: settings } = await supabase
      .from("user_settings")
      .select("webhook_url, webhook_secret, revalidation_prefix")
      .eq("user_id", user.id)
      .maybeSingle();

    let webhookUrl = settings?.webhook_url || "";
    if (webhookUrl && !webhookUrl.startsWith("http")) {
      webhookUrl = "https://" + webhookUrl;
    }
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "No webhook URL configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const webhookSecret = settings?.webhook_secret || "";
    const revalidationPrefix = settings?.revalidation_prefix || "/blog";

    const pingPayload = {
      action: "ping",
      revalidatePath: `${revalidationPrefix}/test`,
      timestamp: new Date().toISOString(),
    };

    const webhookHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-revalidate-path": `${revalidationPrefix}/test`,
      "x-revalidate-tag": "ping-test",
    };
    if (webhookSecret) {
      webhookHeaders["x-webhook-secret"] = webhookSecret;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: webhookHeaders,
      body: JSON.stringify(pingPayload),
    });

    const responseBody = await response.text();

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: responseBody.substring(0, 500),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("test-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
