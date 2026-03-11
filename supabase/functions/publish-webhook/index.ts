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

    // Fetch user settings for webhook secret and revalidation prefix
    const { data: settings } = await supabase
      .from("user_settings")
      .select("webhook_url, webhook_secret, revalidation_prefix")
      .eq("user_id", userId)
      .maybeSingle();

    const webhookSecret = settings?.webhook_secret || "";
    const revalidationPrefix = settings?.revalidation_prefix || "/blog";

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

    // Fetch AEO score if available
    const { data: aeoScore } = await supabase
      .from("aeo_scores")
      .select("overall_score, scores")
      .eq("content_item_id", contentItemId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: run } = await supabase.from("agent_runs").insert({
      user_id: userId,
      agent_name: "Publishing",
      agent_description: "Ships content to CMS and triggers indexing",
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();

    const slug = item.slug || item.id;
    const revalidatePath = `${revalidationPrefix}/${slug}`;
    const now = new Date().toISOString();

    // Build structured data
    const structuredData = item.structured_data || {};
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.seo_title || item.title,
      description: item.meta_description || "",
      datePublished: now,
      dateModified: now,
      author: { "@type": "Person", name: item.author || "Author" },
      ...(item.hero_image_url ? { image: item.hero_image_url } : {}),
    };

    // Build FAQ schema if content has FAQ markers
    let faqSchema = null;
    if ((item.schema_types || []).includes("FAQPage") && structuredData.answer_blocks?.faqs) {
      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: structuredData.answer_blocks.faqs.map((f: any) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      };
    }

    const ogTags = {
      "og:title": item.seo_title || item.title,
      "og:description": item.meta_description || "",
      "og:type": "article",
      ...(item.hero_image_url ? { "og:image": item.hero_image_url } : {}),
    };

    const payload = {
      action: "publish",
      revalidatePath,
      title: item.title,
      seo_title: item.seo_title,
      meta_description: item.meta_description,
      slug,
      content: item.draft_content,
      keyword: item.keyword,
      schema_types: item.schema_types,
      publishedAt: now,
      updatedAt: now,
      structured_data: {
        json_ld: jsonLd,
        faq_schema: faqSchema,
        og_tags: ogTags,
        answer_blocks: structuredData.answer_blocks || null,
      },
      scores: {
        seo: item.seo_score || null,
        aeo: aeoScore?.overall_score || null,
        aeo_breakdown: aeoScore?.scores || null,
      },
    };

    let webhookResult: any = { status: "no_webhook_configured" };

    // If webhook URL is provided, POST to it with ISR headers
    const targetUrl = webhookUrl || "";
    if (targetUrl) {
      try {
        const webhookHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "x-revalidate-path": revalidatePath,
          "x-revalidate-tag": `content-item-${contentItemId}`,
        };
        if (webhookSecret) {
          webhookHeaders["x-webhook-secret"] = webhookSecret;
        }
        if (aeoScore?.overall_score != null) {
          webhookHeaders["x-aeo-score"] = String(aeoScore.overall_score);
        }

        const webhookResponse = await fetch(targetUrl, {
          method: "POST",
          headers: webhookHeaders,
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
    const publishUrl = `${revalidationPrefix}/${slug}`;
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
