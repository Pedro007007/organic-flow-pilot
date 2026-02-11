

## Fix "Live Preview" Button and Match Screenshot Layout

### Problem
The "Live Preview" button in `ReportPreview.tsx` (line 78) is a plain `<Button>` with no `onClick` handler -- it does nothing when clicked. The preview also needs to better match the screenshot style: a clean, white-background floating panel with the three tabs and the CTA preview integrated below.

### Changes

**1. `src/components/ReportPreview.tsx`**
- Add an `onLivePreview` callback prop
- Wire the "Live Preview" button to call it

**2. `src/components/ReportSettings.tsx`**
- Pass an `onLivePreview` handler that opens the report in a new browser tab using `window.open`
- The preview URL will point to `/report/preview` (or a temporary preview route)
- Alternatively (simpler and more reliable): open the preview as a larger modal/dialog overlay so users can see the full-size report without needing a saved scan -- this avoids the problem of needing a real `reportId`

**Recommended approach -- Open as a full-screen dialog overlay:**
Since there may not be a real scan saved yet, the "Live Preview" button will open a full-screen `Dialog` (overlay) showing the `ReportPreview` component at full size with the current settings applied. This matches common "preview" patterns and avoids routing issues.

**3. Visual refinements to match screenshot**
- The preview panel background set to clean white (`bg-white`) with subtle shadow
- The headline centered with proper sizing: "Complete SEO Analysis and Competitor Comparison Tool for Smarter Website Growth"
- Search bar centered with a search icon button
- CTA Preview section styled as a separate card below the main preview, matching the screenshot layout with the "Analyze Now" style button

### Technical Details

- Add `Dialog` import to `ReportSettings.tsx`
- Create state `previewOpen` to control the dialog
- Pass `onLivePreview={() => setPreviewOpen(true)}` to `ReportPreview`
- Inside the dialog, render `ReportPreview` at full width with the current settings
- Below the dialog preview, render the CTA preview cards

Files to modify:
- `src/components/ReportPreview.tsx` -- add `onLivePreview` prop, wire button
- `src/components/ReportSettings.tsx` -- add Dialog-based full-screen preview triggered by the button

