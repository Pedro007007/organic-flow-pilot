import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all pending checklist items for this user (site-wide, no content_item_id)
    const { data: items, error } = await supabase
      .from("seo_checklists")
      .select("*")
      .eq("user_id", userId)
      .is("content_item_id", null)
      .eq("status", "pending");

    if (error) throw error;
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ verified: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user's content items to analyze
    const { data: content } = await supabase
      .from("content_items")
      .select("*")
      .eq("user_id", userId);

    const contentSummary = (content || []).map((c: any) => ({
      title: c.title,
      seo_title: c.seo_title,
      meta_description: c.meta_description,
      slug: c.slug,
      schema_types: c.schema_types,
      draft_content: c.draft_content?.substring(0, 500),
      status: c.status,
    }));

    // Use AI to verify checklist items
    const prompt = `You are an SEO auditor. Given these content items from a website, determine which of the following checklist items can be marked as "done".

Content items: ${JSON.stringify(contentSummary)}

Checklist items to verify:
${items.map((i: any) => `- ID: ${i.id} | "${i.item_label}" (${i.category})`).join("\n")}

Return a JSON array of IDs that should be marked as done. Only mark items that are clearly satisfied based on the content data. Return format: { "done_ids": ["id1", "id2"] }`;

    const aiRes = await fetch("https://lakadtgzlvbatnqvazkn.supabase.co/functions/v1/ai-gateway", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData?.choices?.[0]?.message?.content || "";

    // Parse AI response
    let doneIds: string[] = [];
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        doneIds = parsed.done_ids || [];
      }
    } catch {
      console.error("Failed to parse AI response:", text);
    }

    // Update verified items
    if (doneIds.length > 0) {
      await supabase
        .from("seo_checklists")
        .update({ status: "done", auto_verified: true, verified_at: new Date().toISOString() })
        .in("id", doneIds);
    }

    return new Response(JSON.stringify({ verified: doneIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("checklist-verify error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
