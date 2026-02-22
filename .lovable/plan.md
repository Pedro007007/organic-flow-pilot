

# Fix Missing URL in Content Detail Section

## Problem
The "URL" field in the Details section only displays when `item.url` has a value stored in the database. For most content items, this field is null because it only gets set after publishing via the webhook. This means users cannot see or access the article URL even when a slug exists.

## Solution
Always show the URL in the Details section by falling back to a generated URL from the slug when `item.url` is not set.

## Changes

### File: `src/components/ContentDetail.tsx` (lines 614-619)

Replace the conditional URL display with logic that always shows a URL when either `item.url` or `slug` exists:

- If `item.url` is set, display it as before (with external link)
- Otherwise, if a slug exists, display `/blog/{slug}` as the URL (linking to the blog post page)
- Make the URL clickable as an anchor tag opening in a new tab

### Technical Details

Current code (line 614):
```
{item.url && (
  <div>...</div>
)}
```

New logic:
```
const displayUrl = item.url || (slug ? `/blog/${slug}` : null);
if (displayUrl) { show URL row with clickable link }
```

This ensures the URL is visible as soon as a slug is generated, not only after the publish webhook runs.

