

# Add Landing Page with Privacy Policy and Terms & Conditions

## Why This Is Needed
Google requires a verified Privacy Policy URL before approving OAuth consent screen apps. Without publicly accessible Privacy Policy and Terms pages, the GSC integration cannot be approved for production use.

## What Will Be Built

### 1. Public Landing Page (`/landing`)
- Hero section with app name, tagline, and CTA buttons (Sign In / Sign Up)
- Brief feature highlights (AI-powered SEO, keyword discovery, content pipeline)
- Footer with links to Privacy Policy and Terms & Conditions
- Styled to match the existing dark/light theme

### 2. Privacy Policy Page (`/privacy`)
- Standard privacy policy covering data collection, usage, storage, third-party services (Google Search Console), cookies, and user rights
- Accessible without authentication

### 3. Terms & Conditions Page (`/terms`)
- Standard terms covering acceptable use, account responsibilities, service limitations, and liability
- Accessible without authentication

### 4. Route Changes
- `/` becomes the public landing page (no auth required)
- `/dashboard` becomes the protected app (moved from current `/`)
- `/auth` remains unchanged
- `/privacy` and `/terms` are new public routes

### 5. Navigation Updates
- Landing page footer links to `/privacy` and `/terms`
- Auth page gets small footer links to Privacy Policy and Terms
- Inside the app, Settings page links updated if needed

## Files to Create
- `src/pages/Landing.tsx` -- public landing page
- `src/pages/Privacy.tsx` -- privacy policy content
- `src/pages/Terms.tsx` -- terms and conditions content

## Files to Modify
- `src/App.tsx` -- update routes: `/` to Landing, `/dashboard` to protected Index
- `src/components/SidebarNav.tsx` -- update any home links to `/dashboard`
- `src/pages/Auth.tsx` -- add footer links to privacy/terms
- `src/components/ProtectedRoute.tsx` -- redirect to `/auth` (no change needed, already does this)

## Technical Notes
- All three new pages are public (no authentication required)
- Privacy and Terms pages will use placeholder company name "SEO Engine" which can be customized later
- The privacy policy will specifically mention Google Search Console data access, which is what Google reviewers look for
- Pages will be statically rendered text -- no database or API calls needed
