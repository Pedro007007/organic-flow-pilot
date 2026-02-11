

## Unify Branding to "Searchera" Across the Entire App

### Summary
Replace every occurrence of "SEO Engine" and "Lovable App" with "Searchera" throughout the interface, and ensure the current logo (already in place) is used in the sidebar. The logo image file stays as-is.

### Changes by File

**1. `index.html`** -- Update page title and meta tags
- Title: "Lovable App" -> "Searchera - AI-Powered SEO Growth Engine"
- Meta description -> "AI-powered SEO automation platform for keyword discovery, content generation, and search ranking optimization."
- og:title, og:description, twitter tags updated to match
- Remove TODO comments

**2. `src/components/SidebarNav.tsx`** -- Replace text-only branding with logo + name
- Change "SEO Engine" to "Searchera"
- Change subtitle "AI-Powered Growth" to "AI SEO Growth Engine"
- Replace the Zap icon with the actual logo image (`searchera-logo.png`), sized to fit the sidebar header

**3. `src/pages/Index.tsx`** -- Welcome card
- "Welcome to SEO Engine!" -> "Welcome to Searchera!"

**4. `src/pages/Auth.tsx`** -- Login/signup page
- Replace the Activity icon + "SEO Engine" text with the logo image + "Searchera"

**5. `src/pages/Terms.tsx`** -- Legal text
- All references to "SEO Engine" -> "Searchera"

**6. `src/pages/Privacy.tsx`** -- Legal text
- All references to "SEO Engine" -> "Searchera"

### Technical Details

- The logo file `src/assets/searchera-logo.png` is already the correct image -- no file replacement needed
- In the sidebar, the logo will be imported and displayed as a small image (approx `h-7`) alongside the text "Searchera"
- On the Auth page, the logo replaces the generic Activity icon for brand consistency
- `index.html` meta tags ensure correct branding in browser tabs, social sharing, and search results
