

## Problem Analysis

The app uses dark mode globally. This means `text-foreground` is near-white (`hsl(210, 20%, 96%)`), making all text invisible on the light silver right panel and the white left panel. The logo is also designed for dark backgrounds and disappears on light ones.

## Plan

### 1. Fix text and logo visibility on both panels
Replace all Tailwind theme color classes (`text-foreground`, `text-foreground/60`, etc.) with hardcoded dark colors so they are always readable regardless of the global theme.

**Left panel**: Use explicit dark text colors like `text-gray-900`, `text-gray-700`, `text-gray-500` instead of `text-foreground`.

**Right panel**: Same approach - use `text-gray-900` for headings, `text-gray-600` for subtitles, `text-gray-800` for labels. The "Back to home" link, toggle links, and footer links all need explicit dark colors.

**Logo**: Increase size to `h-[160px]` on the left panel. No filter needed since both panels are light. Use `drop-shadow-md` for subtle depth.

### 2. Add email verification enforcement
After login, check if the user's email is confirmed. If not, block access and show a message with a "Resend verification email" option.

**Changes to `src/pages/Auth.tsx`**:
- After `signInWithPassword` succeeds, check `session.user.email_confirmed_at`
- If null/undefined, sign the user out immediately, show a toast explaining they need to verify their email first
- Add a "Resend verification" button that calls `supabase.auth.resend({ type: 'signup', email })`

**File**: `src/pages/Auth.tsx` only - all changes in one file.

### Technical Details

- No database changes needed - email verification is handled by the auth system
- The project already sends confirmation emails on signup (`emailRedirectTo` is set)
- Auto-confirm is NOT enabled (correct behavior - users must verify)
- The `resend` API allows re-sending the confirmation if the user didn't receive it

