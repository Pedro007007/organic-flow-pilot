
## Fix Why Internal Links Still Show as 0

### What’s actually happening
I double-checked the current code and data, and this is not just one bug.

1. **Generated articles can still lose links after editing**
   - The article in your logs was sent through `content-rewrite` with `action: "expand"`.
   - That function does **not preserve or reinsert internal links**. It simply rewrites raw text.
   - So even if links were present earlier, expand/rewrite can strip them back out.

2. **Generation is not using the article’s real brand context reliably**
   - `ContentDetail.tsx` calls `content-generate` without sending `brandId`, `context`, `referenceLinks`, or `extraKeywords`.
   - In `content-generate`, if `brandId` is missing, it falls back to the default brand.
   - Your saved article belongs to **PJ Media Magnet**, but the article context references **Energy Centre Surrey**, which strongly suggests the wrong brand context was used during generation.

3. **The internal linking config keys are mismatched**
   - Brand settings store:
     - `max_links`
     - `anchor_style`
   - But `content-generate` reads:
     - `max_links_per_article`
     - `anchor_text_style`
   - So the internal linking settings from Brand Management are not being applied correctly.

4. **The scoring function is under-detecting valid links**
   - `optimization-score` only looks at sitemap pages for the current brand.
   - Your database shows sitemap pages exist only for `Energy Centre Surrey`, not for `PJ Media Magnet`.
   - It also does **not** consider `/blog/{slug}` links from existing content items.
   - Result: internal link scoring stays artificially low or zero even when content-to-content links should count.

### Implementation plan

#### 1) Fix generation to use the correct brand and linking settings
Update `supabase/functions/content-generate/index.ts` to:
- Prefer the content item’s own `brand_id` when `contentItemId` is provided
- Load the content item’s saved `context`, `reference_links`, and `extra_keywords` if they are not passed in the request
- Read the correct brand config keys:
  - `max_links`
  - `anchor_style`
- Respect `internal_linking_config.enabled` and `prefer_sitemap`

This ensures generation uses the right brand and the actual internal linking settings from Brand Management.

#### 2) Make rewrite/expand preserve existing internal links
Update `supabase/functions/content-rewrite/index.ts` so rewrite/expand:
- Preserves markdown links already in the article
- Explicitly keeps internal links intact
- Optionally reinforces them by telling the model not to remove any existing `/blog/...` or site links

This is the biggest reason links disappear “after writing.”

#### 3) Improve the internal link candidate pool used for scoring
Update `supabase/functions/optimization-score/index.ts` to:
- Add the same sitemap fallback already used in generation
- Include existing `content_items` with slugs as valid internal link targets
- Score `/blog/{slug}` links as real internal links
- Use the current brand when available, but fall back to all user sitemap pages if that brand has none

This will make the SEO score match reality instead of reporting 0 unfairly.

#### 4) Pass complete article context from the editor
Update `src/components/ContentDetail.tsx` so `handleGenerate()` sends:
- `brandId`
- `context`
- `referenceLinks`
- `extraKeywords`

That removes ambiguity and prevents the function from silently switching to the wrong brand.

#### 5) Tighten the prompt so links are required, not just suggested
In `content-generate`, strengthen the prompt to:
- Require at least 2–4 internal links when candidates exist
- Require links in body sections, not intro/outro only
- Preserve natural anchor text
- Avoid returning an article with zero internal links if candidates were supplied

### Expected result
After these changes:
- New articles should include internal links again
- Expanding/rewriting an article should no longer strip them out
- The optimization panel should stop reporting 0 links when valid internal links exist
- Brand-specific generation should use the correct SEO and linking context

### Technical notes
- No new tables are needed.
- No RLS changes are needed.
- Main files involved:
  - `supabase/functions/content-generate/index.ts`
  - `supabase/functions/content-rewrite/index.ts`
  - `supabase/functions/optimization-score/index.ts`
  - `src/components/ContentDetail.tsx`

### Why I’m confident this is the right fix
The current database and logs show:
- your article has **0 inline internal links**
- rewrite/expand is actively used after drafting
- brand data is mismatched
- internal linking settings are read from the wrong JSON keys
- scoring does not count all real candidate sources

So this needs a coordinated fix across generation, rewrite, scoring, and the editor request payload—not just one edge function.
