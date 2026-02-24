

# Fix Blog Post Card Links

## Problem
The blog post cards on the `/blog` page are not clickable. Each `<article>` element is missing a link to its corresponding `/blog/:slug` route, so clicking does nothing.

## Solution
Wrap each blog post card (or add a `<Link>` inside it) so clicking navigates to `/blog/{slug}`.

## Changes

### `src/pages/BlogPost.tsx` -- no changes needed (already works)

### `src/pages/Blog.tsx`
- Wrap each `<article>` element inside a `<Link to={/blog/${post.slug}}>` so the entire card is clickable
- The Link will replace the outer `<article>` tag or wrap it, keeping all existing styling intact
- The "Read More" text at the bottom already exists visually -- it will now actually work

This is a one-line-level change: add `<Link>` around the card content.
