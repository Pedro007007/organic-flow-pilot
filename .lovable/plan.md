

## Problem

**Vercel Authentication** (not Password Protection) is enabled on the deployment. This intercepts all external requests with a 401 before they reach the Next.js API routes. The screenshot confirms "Enabled for Standard Protection" is toggled on.

## Two Options

**Option A — Disable Vercel Authentication** (simplest)
Toggle off "Vercel Authentication" in the Vercel dashboard screenshot. This lets all external requests through (your webhook secret still authenticates them).

**Option B — Use Protection Bypass for Automation** (keeps Vercel Auth on)
1. In Vercel: Click "+ Add" under "Protection Bypass for Automation" to generate a bypass secret
2. Store that secret in Lovable Cloud as `VERCEL_BYPASS_SECRET`
3. Update both `test-webhook` and `publish-webhook` edge functions to include the header `x-vercel-protection-bypass` with that secret value on every outgoing webhook request

### Code changes for Option B

**`supabase/functions/test-webhook/index.ts`** and **`supabase/functions/publish-webhook/index.ts`**:
- Read `Deno.env.get("VERCEL_BYPASS_SECRET")`
- Add `"x-vercel-protection-bypass": bypassSecret` to the webhook headers object (alongside existing `x-webhook-secret`, `x-revalidate-path`, etc.)

**`src/components/SettingsPage.tsx`**: No changes needed — bypass is infrastructure-level, not user-configurable.

## Recommendation

**Option A** is simplest if you don't need Vercel Auth protecting your preview deployments. Option B keeps the protection but adds a bypass for automation. Which would you prefer?

