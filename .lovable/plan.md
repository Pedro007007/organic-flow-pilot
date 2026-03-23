

## Fix Internal Linking in Content Generation

### Root Cause

Two issues prevent internal links from appearing in generated articles:

1. **Content items filter is too strict**: The query uses `.not("url", "is", null)`, but 9 out of 10 content items have `url: null`. Items with a `slug` (6 of 10) could be used as link candidates via `/blog/{slug}` but are currently excluded.

2. **Brand ID mismatch**: Content items use brand `08da19ff` (PJ Media Magnet) but sitemap pages are stored under brand `0dadb149` (Energy Centre Surrey). When generating for brand `08da19ff`, the sitemap query returns 0 results because no sitemap pages exist for that brand.

Combined, the AI gets an empty `internalLinks` list, so it produces no internal links.

### Fix in `supabase/functions/content-generate/index.ts`

1. **Relax the content items query** — remove `.not("url", "is", null)` and instead filter for items that have either a `url` or a `slug`:
   ```
   .or("url.not.is.null,slug.not.is.null")
   ```

2. **Add sitemap fallback** — if the brand-specific sitemap query returns 0 results, re-query without the `brand_id` filter to get all user sitemap pages as candidates.

3. **No other files need changes** — the system prompt already handles the link list correctly when it's populated.

