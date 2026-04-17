
## Plan: Verify & harden SEO metadata background step

### Goal
Confirm the SEO metadata generation also runs and persists in the background (already working for body images), and add visibility so future runs are easy to verify.

### Steps

1. **Inspect `content-generate/index.ts`** to confirm:
   - SEO metadata generation is inside the same `EdgeRuntime.waitUntil` block as body images
   - It updates `content_items` with `seo_title`, `meta_description`, `slug`, `structured_data`
   - It logs success/failure clearly (currently silent in logs)

2. **Add explicit log lines** for the metadata branch:
   - `"Generating SEO metadata..."`
   - `"SEO metadata saved: { seo_title, slug }"`
   - `"SEO metadata failed: <error>"`
   This makes future verification a one-glance check in edge logs.

3. **Query the most recently generated `content_items` row** for user `pedro.acn@consultant.com` and confirm:
   - `draft_content` populated
   - `hero_image_url` populated
   - body image URLs embedded in markdown
   - `seo_title`, `meta_description`, `slug` populated
   - `structured_data` populated

4. **If any field is missing**, fix the metadata branch (most likely a JSON parse failure or a missing `await` inside `waitUntil`).

5. **Optional UI hint**: in `ContentPipeline` / `ContentDetail`, show a small "Finalising images & metadata…" badge while these background fields are still null, so users know the article is still being completed after first appearance.

### Files involved
- `supabase/functions/content-generate/index.ts`
- `src/components/ContentPipeline.tsx`
- `src/components/ContentDetail.tsx`

### Expected outcome
End-to-end run produces, in order: article text within seconds → body images within ~30s → SEO metadata within ~30s, all visible in logs and in the `content_items` row, with a clear UI indicator while background work is still in flight.
