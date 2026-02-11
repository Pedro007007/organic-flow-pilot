

## Fix PDF Export: Blank/Single-Page Output

### Problem
The PDF export produces a blank white single-page file. Two root causes:

1. **Off-screen rendering fails**: The hidden PDF target uses `absolute left-[-9999px]`, which causes `html2canvas` (used internally by `html2pdf.js`) to fail capturing content that is positioned off-screen.
2. **CSS variables not resolved**: The report components use Tailwind CSS variables like `text-foreground`, `bg-card`, `border-border` etc. Inside the off-screen div, these resolve to theme colors but `html2canvas` often fails to compute them, resulting in invisible (or same-color-on-same-color) text.
3. **Page breaks suppressed**: `pagebreak: { mode: ["avoid-all", ...] }` prevents multi-page output, cramming everything into one page.

### Solution
Replace the current "hidden off-screen div + html2pdf.js" approach with a **section-by-section capture** strategy:

**1. Refactor `ReportPreview.tsx` PDF export (`handleDownloadPdf`)**
- Instead of a single hidden div, temporarily make the PDF container visible (but visually hidden via `opacity-0` + `fixed` + `z-[-1]`) so html2canvas can measure and render it
- Capture each report section individually using `html2canvas`
- Compose sections onto PDF pages using `jsPDF` directly, adding new pages when content overflows
- Use explicit inline background colors (`#1a1a2e`) and text colors (`#ffffff`) on all elements in the PDF container so CSS variable resolution is not needed

**2. Update the hidden PDF render target**
- Replace `absolute left-[-9999px]` with `fixed top-0 left-0 opacity-0 pointer-events-none z-[-1]` so the element is in the viewport for rendering but invisible to the user
- Add `data-pdf-section` attributes to each report section divider
- Apply explicit inline styles (white text, dark background) to all section wrappers instead of relying on CSS variables
- Set a fixed width matching A4 proportions

**3. Multi-page PDF generation logic**
- Use `html2canvas` to capture each `[data-pdf-section]` element individually
- Calculate if each section fits on the current page; if not, add a new page
- Add consistent margins (15mm) and section gaps (4mm)
- Use `jsPDF` for page management and image placement

### Technical Details

**Files to modify:**
- `src/components/ReportPreview.tsx` -- refactor PDF export logic and hidden render target

**Key changes in the export function:**
- Make PDF container temporarily visible (fixed, opacity-0, z-[-1])
- Query all `[data-pdf-section]` elements
- Loop through each, capture with `html2canvas({ scale: 2, useCORS: true, backgroundColor: '#1a1a2e' })`
- Calculate scaled dimensions to fit A4 width (180mm content area)
- Track vertical position; add new page when section doesn't fit
- Save multi-page PDF via `jsPDF`

**Key changes to the hidden render target:**
- Position: `fixed top-0 left-0 w-[210mm] opacity-0 pointer-events-none` with `z-index: -1`
- Each section wrapped in `div[data-pdf-section]` with explicit `style={{ color: '#ffffff', backgroundColor: '#1a1a2e' }}`
- Remove the `pagebreak` option entirely since we handle pagination manually

**Dependencies:** `jsPDF` will be imported from `html2pdf.js` internals (already installed) or we continue using `html2pdf.js` but with corrected configuration. No new packages needed.
