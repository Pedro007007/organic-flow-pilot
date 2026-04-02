

## Fix: Smart Internal Link Resolution in Blog Posts

### Problem
The `upgrade-internal-links` edge function inserts two types of links:
1. **Sitemap pages** — full URLs like `https://yourdomain.com/page` (work correctly)
2. **Published articles** — relative paths like `/blog/slug` which navigate within the Searchera app, not the user's external website

When the content is exported or published on the user's external domain, relative `/blog/slug` links break because those paths don't exist on their website.

### Solution
Update the `upgrade-internal-links` edge function to use **full absolute URLs** for published content items, using the brand's domain when available.

### Changes

**File: `supabase/functions/upgrade-internal-links/index.ts`** (lines 90-95)

Change how published content item URLs are constructed:

```typescript
// Current (broken for external sites):
const u = c.url || (c.slug ? `/blog/${c.slug}` : null);

// New (smart detection):
// If the item has a full external URL, use it
// If only a slug exists, build full URL using brand domain or app domain
const u = c.url || (c.slug
  ? (brand?.domain
      ? `https://${brand.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/blog/${c.slug}`
      : `https://organic-flow-pilot.lovable.app/blog/${c.slug}`)
  : null);
```

This ensures:
- Sitemap page links remain as-is (already full URLs)
- Content items with a custom `url` field use that URL directly
- Content items with only a `slug` get a full URL built from the brand domain
- Fallback to the published app URL if no brand domain is set

Single file change, no database migration needed.

