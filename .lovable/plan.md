

## Fix: GSC redirect_uri_mismatch

### Problem
The `GscConnectionCard` component builds the redirect URI dynamically using `window.location.pathname`, which includes `/dashboard`. But the URI registered in Google Cloud Console uses the root path `/`. Google requires an exact match.

### Solution
Update the redirect URI in the code to always use a fixed path (`/`) instead of the dynamic `window.location.pathname`. This ensures it always matches what's registered in Google Console.

### Also Check: Google Cloud "Testing" Mode
If your Google Cloud project's OAuth consent screen is set to **"Testing"** (not "In production"), only users listed as **Test Users** can authorize. Make sure `pedroxoneal@gmail.com` is added under **OAuth consent screen > Test users** in Google Cloud Console.

### Technical Details

**File: `src/components/GscConnectionCard.tsx`**

Two lines need to change:

1. **Line 58** (exchange code redirect URI):
   - Change: `` const redirectUri = `${window.location.origin}${window.location.pathname}?gsc_callback=true`; ``
   - To: `` const redirectUri = `${window.location.origin}/?gsc_callback=true`; ``

2. **Line 85** (get auth URL redirect URI):
   - Change: `` const redirectUri = `${window.location.origin}${window.location.pathname}?gsc_callback=true`; ``
   - To: `` const redirectUri = `${window.location.origin}/?gsc_callback=true`; ``

### Google Cloud Console URIs Required
Confirm these exact URIs are saved in your Authorized redirect URIs:
- `https://organic-flow-pilot.lovable.app/?gsc_callback=true`
- `https://id-preview--884890d6-eef8-44fb-93f2-2e7a48cc2e5e.lovable.app/?gsc_callback=true`

You can remove the `/~oauth` URIs since those are only needed for Google Sign-In (which this app doesn't use -- it uses email/password login).

### After the Code Fix
1. Make sure your Google Cloud OAuth consent screen has `pedroxoneal@gmail.com` as a test user (if still in Testing mode)
2. Try connecting GSC again from the Settings page

