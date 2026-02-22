
# Fix: Make URL Slug Field Functional

## Problem
The URL Slug field in the SEO Metadata sidebar is just a plain text input. It doesn't auto-generate a slug when the title or keyword exists, and there's no visual indication of what URL it will produce. It feels like it "does nothing."

## Solution
Two improvements to make the slug field useful and interactive:

### 1. Auto-Generate Slug Button
Add a small button next to the URL Slug label that auto-generates a clean slug from the article title (or keyword if no title). This converts the title to lowercase, removes special characters, replaces spaces with hyphens, and strips stop words -- following standard URL slug conventions.

### 2. URL Preview
Show a small preview below the slug input displaying the full URL path the article will be published to (e.g., `/blog/your-slug-here`), so users can see exactly what their URL will look like.

## What Changes

**File: `src/components/ContentDetail.tsx`**

- Add a helper function `generateSlug(text)` that converts a title string into a clean URL slug (lowercase, no special chars, hyphens instead of spaces, stop words removed)
- Add a small "Auto" button next to the "URL Slug" label that calls `generateSlug` using the article title
- Add a URL preview line below the slug input showing the resulting path (e.g., `/blog/your-url-slug`)
- No backend changes needed -- the slug already saves correctly via the existing Save button

## Technical Details

- The slug auto-generation will strip common stop words (the, a, an, and, or, but, in, on, at, to, for, of, with, by, is, are, was, were)
- Special characters and extra hyphens will be cleaned
- Max length remains 100 characters
- The URL preview will use the revalidation prefix `/blog` (matching the publish-webhook default)
- Manually editing the slug will still work -- the auto-generate button is optional
