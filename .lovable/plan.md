

## Fix: Auto-generate Technical SEO metadata during content generation

### Problem
Technical SEO scores low (35/100) because the `content-generate` edge function only saves `draft_content`, `status`, and `brand_id`. It never generates or saves `seo_title`, `meta_description`, `slug`, or `schema_types` — the exact fields the optimization scorer evaluates for Technical SEO.

### Solution
Update the `content-generate` edge function to auto-generate Technical SEO metadata alongside the article content, so every new article starts with proper meta tags.

### Technical details

**File: `supabase/functions/content-generate/index.ts`**
- After generating the article content, make a second lightweight AI call (using tool/function calling) to generate:
  - `seo_title` (50-60 chars, keyword-first)
  - `meta_description` (150-160 chars, compelling with keyword)
  - `slug` (URL-safe, keyword-rich, max 60 chars)
  - `schema_types` (e.g. `["Article", "FAQPage"]` based on content structure)
- Update the `content_items` save (line 307) to include these four fields alongside `draft_content`

**Update block (line 306-312):**
```typescript
await supabase.from("content_items").update({
  draft_content: content,
  status: "writing",
  brand_id: brandId || brand?.id || null,
  seo_title: metadata.seo_title,
  meta_description: metadata.meta_description,
  slug: metadata.slug,
  schema_types: metadata.schema_types,
}).eq("id", contentItemId).eq("user_id", userId);
```

This ensures every generated article has Technical SEO metadata from the start, raising that dimension score significantly without requiring a separate optimization step.

