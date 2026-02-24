
# Fix Blog Listing to Show Real Published Articles

## Problem
The blog listing page (`/blog`) displays 6 hardcoded placeholder articles with slugs like `what-is-aeo`, `seo-vs-aeo`, etc. When clicked, the blog post page queries the database for these slugs, but they don't exist -- only real user-created articles are in the database. This causes the "Article Not Found" message.

## Solution
Replace the hardcoded blog post array with a live query to the `content_items` table, fetching only published articles. This way the blog listing and the blog post detail page both use the same data source.

## Changes

### `src/pages/Blog.tsx`
- Remove the hardcoded `blogPosts` array
- Add a React Query hook to fetch published articles from `content_items` (where `status = 'published'`)
- Display real article data (title, meta_description as excerpt, updated_at as date, hero_image_url, slug)
- Show a loading skeleton while fetching
- Show an empty state message if no published articles exist yet
- Keep the existing card layout, header, CTA section, and footer unchanged

### No database changes needed
The `content_items` table already has a public SELECT RLS policy and contains published articles with slugs.
