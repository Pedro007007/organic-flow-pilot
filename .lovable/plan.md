
# Export Blog Posts to .docx

## Overview
Add an "Export" button to the `BlogPost` page that downloads the article as a `.docx` file containing the full HTML (headings, lists, links, images, schema markup, meta tags, etc.) so it can be dropped directly into a CMS or website.

## Approach
Use a simple, dependency-free method: render the markdown content as a complete HTML document, then save it as a `.docx` file via a Blob download. Microsoft Word (and Google Docs) natively open HTML files saved with a `.docx` extension, preserving all formatting, tags, and structure.

No new libraries are needed.

## Changes

### 1. `src/pages/BlogPost.tsx`
- Add a `Download` icon import from lucide-react
- Add an `Export .docx` button next to the "Back to Blog" link (top of the article)
- Implement an `handleExportDocx` function that:
  - Builds a full HTML string including:
    - SEO meta tags (`<title>`, `<meta name="description">`)
    - Hero image as `<img>` tag
    - Article title as `<h1>`
    - Author and date metadata
    - The article body (markdown converted to HTML using a hidden rendered element or a lightweight markdown-to-HTML conversion)
    - JSON-LD structured data `<script>` block
  - Wraps it in a proper `<!DOCTYPE html>` document
  - Creates a Blob with MIME type `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - Triggers a file download named after the article slug

### Technical Detail
To convert the markdown to HTML without adding a dependency, the function will grab the `innerHTML` from the already-rendered prose container using a React `useRef`. This ensures the exported HTML matches exactly what is displayed, including all tags and formatting.
