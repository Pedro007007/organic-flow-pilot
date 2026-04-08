import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { evaluateFulfilment } from "../_shared/fulfilment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { contentItemId } = await req.json();
    if (!contentItemId) throw new Error("contentItemId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: content, error: contentError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (contentError || !content) throw new Error("Content item not found");

    let brandDomain = "";
    if (content.brand_id) {
      const { data: brand } = await supabase
        .from("brands")
        .select("domain")
        .eq("id", content.brand_id)
        .eq("user_id", user.id)
        .maybeSingle();
      brandDomain = brand?.domain || "";
    }

    const { data: criteria, error: criteriaError } = await supabase
      .from("seo_fulfilment")
      .select("id, criterion")
      .eq("content_item_id", contentItemId)
      .eq("user_id", user.id);

    if (criteriaError) throw criteriaError;
    if (!criteria || criteria.length === 0) {
      return new Response(JSON.stringify({ passed: 0, results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const evaluation = evaluateFulfilment(content, brandDomain);
    const checkedAt = new Date().toISOString();
    const results = criteria.map((row) => {
      const result = evaluation[row.criterion] || {
        passed: false,
        details: "No validator exists for this criterion.",
      };

      return {
        id: row.id,
        criterion: row.criterion,
        passed: result.passed,
        details: result.details,
        checked_at: checkedAt,
      };
    });

    const updates = await Promise.all(
      results.map((result) =>
        supabase
          .from("seo_fulfilment")
          .update({
            passed: result.passed,
            details: result.details,
            checked_at: checkedAt,
          })
          .eq("id", result.id)
          .eq("user_id", user.id)
      )
    );

    const failedUpdate = updates.find(({ error }) => error);
    if (failedUpdate?.error) throw failedUpdate.error;

    return new Response(JSON.stringify({
      passed: results.filter((result) => result.passed).length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fulfilment-scan error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
