

## Add Delete Articles to Content Pipeline

### What
Add a bulk delete button and individual delete option so users can remove content items and clean up their workspace.

### Changes

**`src/components/ContentPipeline.tsx`**:

1. **Import** `Trash2` icon from lucide-react and `AlertDialog` components for confirmation
2. **Add state**: `bulkDeleting` boolean
3. **Add `handleBulkDelete` function**: Deletes selected items from `content_items` table via `supabase.from("content_items").delete().in("id", ids)`, then clears selection and invalidates query cache
4. **Add delete button in bulk actions bar** (next to the "Move to..." dropdown): A red "Delete" button that shows a confirmation dialog before executing. Shows count of items to be deleted.
5. **Add individual delete**: A trash icon button on each row (visible on hover) that deletes a single item with confirmation

The confirmation dialog prevents accidental deletion. Related data (aeo_scores, optimization_jobs, seo_fulfilment, repurposed_content) should be cleaned up — will check if cascade deletes exist, otherwise the delete will target just content_items.

### Technical detail
- Uses existing `AlertDialog` UI component for confirmation
- DELETE is already allowed by RLS policy on `content_items` for authenticated users who own the record
- Invalidates `["content_items"]` query after deletion to refresh the list

