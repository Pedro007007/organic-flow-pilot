

# Add Context, Reference Links & Extra Keywords to Create Content Dialog

## What Changes

Enhance the "Create Content Item" dialog in ContentPipeline with three new fields:

1. **Context** -- a textarea for adding background information or specific instructions the AI should follow when generating the article
2. **Reference Links** -- a multi-link input where users can paste URLs that the AI will use as source material/inspiration
3. **Extra Keywords** -- a comma-separated input for additional secondary/LSI keywords to weave into the content

These fields will be stored on the `content_items` table and passed through to the content generation edge function so the AI produces articles grounded in the user's provided context and references.

## Database Changes

Add 3 new nullable columns to `content_items`:

```sql
ALTER TABLE public.content_items
  ADD COLUMN context text,
  ADD COLUMN reference_links text[],
  ADD COLUMN extra_keywords text[];
```

No RLS changes needed -- existing policies cover these columns.

## UI Changes

### File: `src/components/ContentPipeline.tsx`

Add three new fields inside the Create Content Item dialog, between the Brand selector and the action buttons:

```text
+-------------------------------+
| Title           [input]       |
| Target Keyword  [input]       |
| Brand           [select]      |
| Context         [textarea]    |  <-- NEW
| Reference Links [link input]  |  <-- NEW (paste URL + Add button, shows chips)
| Extra Keywords  [input]       |  <-- NEW (comma-separated)
|                               |
| [+ Create]  [🚀 Autopilot]   |
+-------------------------------+
```

- **Context**: A `<Textarea>` with placeholder "Add background context, specific instructions, or notes for the AI..."
- **Reference Links**: An `<Input>` with an "Add" button. Each pasted URL becomes a removable chip/tag below the input. Stored as `string[]`.
- **Extra Keywords**: A simple `<Input>` with placeholder "e.g. local seo, google ranking, organic traffic" -- parsed into array on save.

New state variables: `context`, `referenceLinks` (array), `extraKeywords`.

Update `handleCreate` to include these in the insert: `context`, `reference_links`, `extra_keywords`.

Update `runFullPipeline` to pass `context`, `referenceLinks`, and `extraKeywords` to the `content-generate` function call.

Reset all new fields when dialog closes.

## Backend Changes

### File: `supabase/functions/content-generate/index.ts`

1. Destructure `context`, `referenceLinks`, `extraKeywords` from the request body
2. Append to the user prompt:
   - If `context`: add a "CONTEXT & INSTRUCTIONS" section
   - If `referenceLinks`: add a "REFERENCE SOURCES" section listing the URLs for the AI to consider
   - If `extraKeywords`: add a "SECONDARY KEYWORDS" section instructing natural inclusion

This ensures the AI uses the provided context, draws from the reference material conceptually, and weaves in extra keywords naturally alongside the primary keyword.

