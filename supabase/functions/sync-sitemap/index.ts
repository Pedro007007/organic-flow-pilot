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

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = data.claims.sub;

    const body = await req.json();
    const brandId = body.brandId;
    const sitemapUrl = (body.sitemapUrl || "").trim();
    if (!brandId || !sitemapUrl) {
      return new Response(JSON.stringify({ error: "brandId and sitemapUrl are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: brand } = await supabase.from("brands").select("id, domain").eq("id", brandId).eq("user_id", userId).maybeSingle();
    if (!brand) {
      return new Response(JSON.stringify({ error: "Brand not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const commonSitemapPaths = [
      "/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml",
      "/wp-sitemap.xml", "/sitemap.xml.gz", "/page-sitemap.xml",
      "/post-sitemap.xml", "/sitemap1.xml", "/sitemap/sitemap-index.xml",
    ];

    const isLikelySitemap = /sitemap.*\.xml/i.test(sitemapUrl) || sitemapUrl.endsWith(".xml");

    async function fetchSitemap(url: string): Promise<{ xml: string; finalUrl: string } | null> {
      try {
        console.log(`Trying sitemap: ${url}`);
        const res = await fetch(url, { headers: { "User-Agent": "Searchera-Bot/1.0" }, redirect: "follow" });
        if (!res.ok) return null;
        const text = await res.text();
        if (text.includes("<urlset") || text.includes("<sitemapindex")) {
          return { xml: text, finalUrl: url };
        }
        return null;
      } catch { return null; }
    }

    async function discoverFromRobotsTxt(baseUrl: string): Promise<string[]> {
      try {
        console.log(`Checking robots.txt: ${baseUrl}/robots.txt`);
        const res = await fetch(`${baseUrl}/robots.txt`, { headers: { "User-Agent": "Searchera-Bot/1.0" }, redirect: "follow" });
        if (!res.ok) return [];
        const text = await res.text();
        const urls: string[] = [];
        for (const line of text.split("\n")) {
          const match = line.match(/^Sitemap:\s*(.+)/i);
          if (match) urls.push(match[1].trim());
        }
        if (urls.length > 0) console.log(`Found ${urls.length} sitemaps in robots.txt`);
        return urls;
      } catch { return []; }
    }

    // Firecrawl Map API fallback for sites without sitemaps
    async function discoverViaFirecrawl(baseUrl: string): Promise<string[]> {
      const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!apiKey) {
        console.log("FIRECRAWL_API_KEY not set, skipping crawl fallback");
        return [];
      }
      try {
        console.log(`Using Firecrawl Map to discover URLs for: ${baseUrl}`);
        const res = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: baseUrl, limit: 500, includeSubdomains: false }),
        });
        if (!res.ok) {
          console.warn(`Firecrawl Map returned ${res.status}`);
          return [];
        }
        const data = await res.json();
        const links: string[] = data?.links || [];
        console.log(`Firecrawl Map discovered ${links.length} URLs`);
        return links;
      } catch (e) {
        console.warn("Firecrawl Map error:", e);
        return [];
      }
    }

    let xml: string | null = null;
    let resolvedUrl = sitemapUrl;
    let baseUrl = sitemapUrl.replace(/\/+$/, "");
    try { baseUrl = new URL(sitemapUrl).origin; } catch { /* use as-is */ }

    // 1. Direct sitemap URL
    if (isLikelySitemap) {
      const result = await fetchSitemap(sitemapUrl);
      if (result) { xml = result.xml; resolvedUrl = result.finalUrl; }
    }

    // 2. robots.txt
    if (!xml) {
      const robotsSitemaps = await discoverFromRobotsTxt(baseUrl);
      for (const robotsUrl of robotsSitemaps) {
        const result = await fetchSitemap(robotsUrl);
        if (result) { xml = result.xml; resolvedUrl = result.finalUrl; break; }
      }
    }

    // 3. Common paths
    if (!xml) {
      for (const path of commonSitemapPaths) {
        const result = await fetchSitemap(`${baseUrl}${path}`);
        if (result) { xml = result.xml; resolvedUrl = result.finalUrl; break; }
      }
    }

    let allPageUrls: string[] = [];
    let discoveryMethod = "sitemap";

    if (xml) {
      console.log(`Using sitemap: ${resolvedUrl}`);
      const urlRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
      const urls: string[] = [];
      let match;
      while ((match = urlRegex.exec(xml)) !== null) urls.push(match[1]);

      if (urls.length === 0) {
        return new Response(JSON.stringify({ error: "Sitemap found but contains no URLs" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const isSitemapIndex = xml.includes("<sitemapindex");
      if (isSitemapIndex) {
        const childSitemaps = urls.slice(0, 5);
        for (const childUrl of childSitemaps) {
          try {
            const childRes = await fetch(childUrl, { headers: { "User-Agent": "Searchera-Bot/1.0" }, redirect: "follow" });
            if (!childRes.ok) continue;
            const childXml = await childRes.text();
            const childUrlRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
            let childMatch;
            while ((childMatch = childUrlRegex.exec(childXml)) !== null) allPageUrls.push(childMatch[1]);
          } catch { /* skip */ }
        }
      } else {
        allPageUrls = urls;
      }
    } else {
      // 4. Firecrawl fallback — crawl the site to discover pages
      allPageUrls = await discoverViaFirecrawl(baseUrl);
      discoveryMethod = "crawl";

      if (allPageUrls.length === 0) {
        return new Response(JSON.stringify({
          error: `No sitemap found and crawl returned no pages for ${baseUrl}. You can add pages manually instead.`,
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Limit to 500 pages
    allPageUrls = allPageUrls.slice(0, 500);
    console.log(`Found ${allPageUrls.length} URLs via ${discoveryMethod}`);

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
      discovery_method: discoveryMethod,
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
  } catch { return url; }
}
