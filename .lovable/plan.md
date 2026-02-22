
# Add Individual Blog Article Page

## Problem
When navigating to `/blog/high-efficiency-solar-installs-guide`, the app shows a 404 page. There is no route or page to display individual published articles. The app only has a `/blog` route for the static blog listing.

## Solution
Create a new `BlogPost` page component and add a `/blog/:slug` route so that published content items can be viewed by their URL slug.

## What Changes

### 1. New File: `src/pages/BlogPost.tsx`
A new page component that:
- Reads the `:slug` parameter from the URL
- Fetches the matching content item from the `content_items` table (where `slug = :slug` and `status = 'published'`)
- Renders the article with its title, SEO title, meta description, hero image, and full content (using `react-markdown` which is already installed)
- Includes JSON-LD structured data from the `structured_data` column
- Shows a loading spinner while fetching
- Shows a "not found" message if no matching published article exists
- Uses the same header/footer layout as the existing Blog listing page for visual consistency

### 2. File: `src/App.tsx`
- Import the new `BlogPost` component
- Add route: `<Route path="/blog/:slug" element={<BlogPost />} />` (above the catch-all route)

## Technical Details

- Query: `supabase.from("content_items").select("*").eq("slug", slug).eq("status", "published").maybeSingle()`
- The `content_items` table already has `slug`, `status`, `draft_content`, `seo_title`, `meta_description`, `hero_image_url`, `structured_data`, and `schema_types` columns
- RLS note: published articles need to be publicly readable. A new RLS policy will be added: `SELECT` on `content_items` where `status = 'published'` for anonymous users
- Content rendered via `react-markdown` (already a project dependency)
- Page styled with the same light theme, header, and footer as the `/blog` listing page
