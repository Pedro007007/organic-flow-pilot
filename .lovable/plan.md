
# Fix: "Content not found" error when clicking content items

## Root Cause

The Content Pipeline displays **mock/placeholder data** when the database query hasn't returned results yet or returns an empty list. These mock items have simple IDs like `"1"`, `"2"`, etc. When you click one, the detail view tries to fetch that ID from the database, fails (because ID `"1"` doesn't exist as a real UUID), and shows "Content not found!"

## Solution

Two changes to fix this:

### 1. Remove mock data fallback for content items
In `src/pages/Index.tsx`, stop substituting mock content when the real query returns empty. Instead, show the empty state (which already exists in `ContentPipeline.tsx` with a "No content items yet" message). This ensures you only ever click on real items that exist in the database.

### 2. Improve error handling in ContentDetail
In `src/components/ContentDetail.tsx`, instead of immediately calling `onBack()` when content isn't found, show a proper "not found" message within the detail view so the user understands what happened. This acts as a safety net.

## Technical Details

**File: `src/pages/Index.tsx`**
- Change line 38 from `const displayContent = content?.length ? content : mockContent;` to just use `content || []`
- This means the content pipeline shows an empty state until real content is created, rather than showing fake clickable items

**File: `src/components/ContentDetail.tsx`**
- Lines 82-87: Instead of immediately calling `onBack()` on "not found", render an inline error state with a "Back to pipeline" button, so the navigation isn't jarring

These two changes together eliminate the root cause (clicking non-existent items) and add a graceful fallback for edge cases.
