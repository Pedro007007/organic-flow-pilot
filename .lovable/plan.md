

## Sitemap-Powered Internal Linking

Upgrade the `content-generate` edge function to prioritize real sitemap URLs when building internal link suggestions for AI-generated content.

### How It Works Today

The function queries `content_items` (up to 20 rows with a non-null URL) and feeds those as internal link candidates to the AI prompt. If no links exist, it falls back to placeholder format.

### What Changes

**Edge function: `supabase/functions/content-generate/index.ts`**

After fetching `content_items` for links, also query `sitemap_pages` filtered by the brand (if available). Merge both sources into a single deduplicated list of internal link candidates, with sitemap pages taking priority (they represent real, live URLs on the domain).

### Technical Details

1. **Query sitemap_pages** -- After the existing `content_items` fetch (line ~64), add a query:
   - Filter by `user_id` and optionally by `brand_id` (from the content item's brand or the resolved brand)
   - Select `url` and `title`, limit 50
   
2. **Merge and deduplicate** -- Combine sitemap pages + content items into one link list. Sitemap pages come first (real URLs). Deduplicate by URL. Cap at `maxLinks * 3` candidates (give AI more options than the final count).

3. **Update the prompt** -- The existing `internalLinks` variable will now contain a richer set of real URLs from the sitemap, making the AI's internal linking much more accurate and useful.

No database changes needed -- the `sitemap_pages` table already has the right schema. No UI changes needed -- this is a backend-only improvement that automatically benefits all content generation.

