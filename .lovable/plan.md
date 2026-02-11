

## Replace Logo and Zoom to 280%

### What will be done
1. **Copy the uploaded logo** (`user-uploads://2-2.png`) to `src/assets/searchera-logo.png`, replacing the current logo file
2. **Keep the existing size classes** -- the header already uses `h-[100px]` and the footer uses `h-[90px]`, which match the 280% zoom preference from the project style guide. No size changes needed.

### Technical Details

**Step 1:** Copy `user-uploads://2-2.png` to `src/assets/searchera-logo.png` (overwrite)

**Step 2:** No code changes required -- `Landing.tsx` and `SidebarNav.tsx` already import from `@/assets/searchera-logo.png`, so the new image will appear automatically everywhere the logo is used.

