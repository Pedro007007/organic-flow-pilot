

## Problem

When generating body images in the Image Management section, the new image URLs are inserted into `draftContent` **local state only** — they are never saved to the database. If the user navigates away or refreshes, the generated body images are lost. The hero image works because the edge function saves `hero_image_url` directly to the DB, but body images rely on being embedded in `draft_content` markdown, which requires a manual "Save" click.

## Fix

**File: `src/components/ContentDetail.tsx`**

After `handleRegenerateBodyImage` updates the `draftContent` state with the new image markdown, auto-save the updated `draft_content` to the database. Since `setDraftContent` is async, compute the new content value inline and save it directly to Supabase in the same function, rather than relying on the state update.

Changes to `handleRegenerateBodyImage` (lines 427-460):
1. Compute the new draft content string (currently done inside `setDraftContent` callback)
2. Save the computed value to the DB via `supabase.from("content_items").update({ draft_content: newContent })`
3. Show a toast confirming save

This ensures body images persist immediately without requiring a manual save.

