

# Export Feature on Content Detail Page

## What Changes

Add an **Export** dropdown button to the content detail page's top bar (next to Save/Reject). When clicked, it shows a dropdown menu with multiple export format options. This lets users export their content directly from the dashboard where they create and optimize it, without needing to go to the blog post page.

## Export Formats

- **Markdown (.md)** -- raw markdown as stored in the draft
- **HTML (.html)** -- full HTML document with SEO metadata, hero image, JSON-LD structured data
- **DOCX (.docx)** -- Word-compatible HTML document (same approach as existing BlogPost export)
- **Plain Text (.txt)** -- stripped markdown, no formatting
- **PDF (.pdf)** -- uses existing jsPDF + html2canvas approach (renders preview then captures)

## UI Layout

The Export button sits in the top bar alongside Save and Reject:

```text
[SERP Research] [Generate] [Optimize] [Export v] [Save] [Reject] [Move to ...]
```

The dropdown arrow reveals:

```text
+------------------------+
| Export as Markdown     |
| Export as HTML         |
| Export as DOCX         |
| Export as Plain Text   |
+------------------------+
```

## Technical Details

### File: `src/components/ContentDetail.tsx`

1. Import `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu` and the `Download` icon from lucide-react

2. Add export handler functions:
   - **exportMarkdown**: Downloads `draftContent` as a `.md` file
   - **exportHtml**: Builds a full HTML document including `<head>` with SEO title, meta description, JSON-LD structured data, hero image, and rendered markdown body. Downloads as `.html`
   - **exportDocx**: Same HTML content as exportHtml but saved with `.docx` extension and Word MIME type (matches existing BlogPost pattern)
   - **exportPlainText**: Strips markdown syntax from `draftContent` using regex and downloads as `.txt`

3. Add the Export dropdown button in the top bar actions area, visible whenever there is draft content to export (not gated by status)

4. Each format generates a Blob, creates an object URL, triggers a download with the slug or title as filename, then revokes the URL

### No backend changes needed
All export logic runs client-side using the existing draft content and metadata already loaded in the component state.
