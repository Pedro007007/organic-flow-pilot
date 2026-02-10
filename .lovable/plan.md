

# Next Phase: Theme, AI Editor, Payments & Team Collaboration

This phase adds five feature areas: visual theming (dark/light + pink-orange gradient), a rich content editor with AI rewrite, payment history via Stripe, Google Search Console OAuth, and team collaboration with roles.

---

## 1. Dark/Light Mode Toggle + Pink-Orange Gradient Theme

Currently the app is dark-only. We'll add a theme switcher and update the background to use a subtle fading pink-to-orange gradient.

**Changes:**
- Add a light mode `:root` theme in `src/index.css` alongside the existing dark theme
- Update `--background` in dark mode to use a subtle pink-orange gradient via a CSS class on `body`
- Add a theme toggle button to the sidebar (`SidebarNav.tsx`) using `next-themes` (already installed)
- Wrap the app with `ThemeProvider` in `src/App.tsx`

---

## 2. Content Editor with AI Rewrite

Replace the plain `<Textarea>` in `ContentDetail.tsx` with a richer editing experience that includes AI-powered rewrite, expand, and shorten actions.

**Changes:**
- Create a new edge function `supabase/functions/content-rewrite/index.ts` that calls Lovable AI (Gemini Flash) with the selected text and an action (rewrite/expand/shorten)
- Update `ContentDetail.tsx` to add a floating toolbar above the textarea with "Rewrite", "Expand", and "Shorten" buttons
- When clicked, the selected text (or full draft) is sent to the edge function and the response replaces the content
- Update `supabase/config.toml` to register the new function

---

## 3. Payment History (Stripe Integration)

Add a payment/billing section to the Settings page so users can view their subscription and payment history.

**Changes:**
- Enable the Stripe integration (will prompt for secret key)
- After Stripe is enabled, implement a billing section with subscription management and payment history display
- Add a "Billing" nav item to the sidebar

---

## 4. Google Search Console OAuth

Currently GSC data is ingested via manual JSON upload. We'll add a proper OAuth flow.

**Changes:**
- Add a "Connect GSC" button in Settings that initiates Google OAuth
- Create an edge function `supabase/functions/gsc-oauth/index.ts` to handle the OAuth callback and store refresh tokens
- Update `gsc-ingest` to use stored credentials for automatic data pulls
- This requires a Google Cloud project with Search Console API enabled -- we'll need the OAuth client ID and secret as backend secrets

---

## 5. Team Collaboration & Roles

The `user_roles` table and `has_role` function already exist with `admin`, `operator`, and `viewer` roles. We'll build the UI layer.

**Changes:**
- Create `src/components/TeamManagement.tsx` -- a settings sub-page showing team members, their roles, and an invite form
- Create a database table `team_invites` for pending invitations
- Add role-based UI guards: viewers see read-only views, operators can edit content, admins can manage team and settings
- Add a "Team" nav item to the sidebar (visible to admins only)

---

## Recommended Sequencing

Given the scope, I recommend breaking this into **two batches**:

**Batch 1** (visual + AI -- no external dependencies):
1. Dark/Light mode toggle + pink-orange gradient background
2. Content editor with AI rewrite tools

**Batch 2** (integrations -- requires secrets/setup):
3. Stripe payment history
4. Google Search Console OAuth
5. Team collaboration UI

---

## Technical Details

### Theme System (index.css additions)

A new `.light` class will define light-mode CSS variables. The gradient background applies via a utility class on `<body>`:
- Dark mode: deep navy base with a subtle radial pink-orange gradient overlay
- Light mode: clean white/gray with the same pink-orange gradient at reduced opacity

### AI Rewrite Edge Function

```text
POST /functions/v1/content-rewrite
Body: { text: string, action: "rewrite" | "expand" | "shorten" }
Response: { result: string }
```

Uses `LOVABLE_API_KEY` (auto-provisioned) to call `google/gemini-3-flash-preview` with action-specific system prompts.

### Database Changes

```sql
-- Team invites table
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/index.css` | Update -- add light theme vars + gradient background |
| `src/App.tsx` | Update -- wrap with ThemeProvider |
| `src/components/SidebarNav.tsx` | Update -- add theme toggle + Team nav |
| `src/components/ContentDetail.tsx` | Update -- add AI rewrite toolbar |
| `supabase/functions/content-rewrite/index.ts` | Create |
| `supabase/functions/gsc-oauth/index.ts` | Create |
| `src/components/TeamManagement.tsx` | Create |
| `src/components/SettingsPage.tsx` | Update -- add billing section |
| `src/pages/Index.tsx` | Update -- add team route |
| Database migration (team_invites) | Create |

