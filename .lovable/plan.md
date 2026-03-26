

## Add Unpublish & Delete Options for Content Items

### What this adds
1. **Unpublish button** on the content detail page — moves a published/monitoring article back to "optimizing" status, removing it from the public blog while preserving all content
2. **Delete button** on the content detail page — permanently removes the content item (with confirmation dialog)
3. Both actions available from the content pipeline list as well (via a dropdown menu or action buttons)

### Technical details

**File: `src/components/ContentDetail.tsx`**
- Add an "Unpublish" button (visible when status is `published` or `monitoring`) that calls `supabase.from("content_items").update({ status: "optimizing", url: null }).eq("id", item.id)`
- Add a "Delete" button with a confirmation dialog that calls `supabase.from("content_items").delete().eq("id", item.id)` then navigates back to the pipeline
- Both buttons in a dropdown or action bar near the top of the page

**File: `src/components/ContentPipeline.tsx`**
- Add a context menu or action dropdown on each content row with "Unpublish" and "Delete" options
- Same logic as above, with toast confirmations

**No database changes needed** — the existing `content_items` table and RLS policies already support updates and deletes by the owning user.

