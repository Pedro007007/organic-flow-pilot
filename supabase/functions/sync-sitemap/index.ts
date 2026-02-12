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

    const { brandId, sitemapUrl } = await req.json();
    if (!brandId || !sitemapUrl) {
      return new Response(JSON.stringify({ error: "brandId and sitemapUrl are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify brand ownership
    const { data: brand } = await supabase.from("brands").select("id, domain").eq("id", brandId).eq("user_id", userId).maybeSingle();
    if (!brand) {
      return new Response(JSON.stringify({ error: "Brand not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Fetching sitemap: ${sitemapUrl}`);

    const sitemapRes = await fetch(sitemapUrl, {
      headers: { "User-Agent": "Searchera-Bot/1.0" },
    });

    if (!sitemapRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch sitemap: ${sitemapRes.status}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const xml = await sitemapRes.text();

    // Parse URLs from XML sitemap
    const urlRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
    const urls: string[] = [];
    let match;
    while ((match = urlRegex.exec(xml)) !== null) {
      urls.push(match[1]);
    }

    if (urls.length === 0) {
      return new Response(JSON.stringify({ error: "No URLs found in sitemap" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if this is a sitemap index (contains other sitemaps)
    const isSitemapIndex = xml.includes("<sitemapindex");
    
    let allPageUrls: string[] = [];

    if (isSitemapIndex) {
      // Fetch child sitemaps (limit to first 5 to avoid timeout)
      const childSitemaps = urls.slice(0, 5);
      for (const childUrl of childSitemaps) {
        try {
          const childRes = await fetch(childUrl, {
            headers: { "User-Agent": "Searchera-Bot/1.0" },
          });
          if (!childRes.ok) continue;
          const childXml = await childRes.text();
          const childUrlRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
          let childMatch;
          while ((childMatch = childUrlRegex.exec(childXml)) !== null) {
            allPageUrls.push(childMatch[1]);
          }
        } catch {
          // Skip failed child sitemaps
        }
      }
    } else {
      allPageUrls = urls;
    }

    // Limit to 500 pages
    allPageUrls = allPageUrls.slice(0, 500);

    console.log(`Found ${allPageUrls.length} URLs in sitemap`);

    // Delete existing sitemap pages for this brand
    await supabase.from("sitemap_pages").delete().eq("brand_id", brandId).eq("user_id", userId);

    // Insert new pages in batches of 50
    const now = new Date().toISOString();
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < allPageUrls.length; i += batchSize) {
      const batch = allPageUrls.slice(i, i + batchSize).map((url) => ({
        user_id: userId,
        brand_id: brandId,
        url,
        title: extractTitleFromUrl(url),
        last_synced_at: now,
      }));

      const { error: insertError } = await supabase.from("sitemap_pages").insert(batch);
      if (!insertError) {
        inserted += batch.length;
      } else {
        console.warn("Batch insert error:", insertError.message);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      pages_found: allPageUrls.length,
      pages_imported: inserted,
      is_sitemap_index: isSitemapIndex,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-sitemap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractTitleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    return slug
      .replace(/[-_]/g, " ")
      .replace(/\.\w+$/, "")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || url;
  } catch {
    return url;
  }
}
