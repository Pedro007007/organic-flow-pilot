

# Add "Generate SEO Metadata" Button

## Problem
The SEO Metadata sidebar (SEO Title, Meta Description, URL Slug) exists on the Content Detail page, but the "Optimize SEO" button in the top toolbar only appears when the content is in the **"writing"** stage. If you miss that stage or want to regenerate metadata later, there is no way to trigger it. The fields stay empty.

## Solution
Add a **"Generate SEO Metadata"** button directly inside the SEO Metadata sidebar card. This button will be visible at **all stages** (as long as draft content exists) and will call the same `seo-optimize` backend function that already works.

## What Changes

**File: `src/components/ContentDetail.tsx`**

1. Add a "Generate SEO Metadata" button with a sparkle icon inside the SEO Metadata card header (next to the "SEO Metadata" title on line 554)
2. The button will call the existing `handleOptimize` function -- no new backend work needed
3. The button will be disabled when there is no draft content or when another operation is running
4. It will show a loading spinner while generating

The result: users can generate or regenerate SEO titles, meta descriptions, and URL slugs from the metadata sidebar at any point in the content lifecycle, not just during the "writing" stage.

## Technical Details

- The existing `handleOptimize` function (lines 163-182) already calls the `seo-optimize` edge function and updates `seoTitle`, `metaDescription`, and `slug` state
- The edge function `supabase/functions/seo-optimize/index.ts` is fully implemented and uses AI to generate optimized metadata
- No database changes, no new edge functions, no new dependencies required
- The top-bar "Optimize SEO" button (writing stage only) will remain as-is for workflow continuity

