

## Problem

The webhook URL stored in Settings is `nextjs-boilerplate-masterpedro.vercel.app` — it's missing the `https://` protocol and the `/api/publish` path. Deno's `fetch()` throws "Invalid URL" because it requires a fully qualified URL.

## Fix: Two changes

### 1. Update the saved webhook URL (user action)
Change the Webhook URL field in Settings to:
```
https://nextjs-boilerplate-masterpedro.vercel.app/api/publish
```
Then click "Save Settings".

### 2. Add URL validation in the frontend (code change)
**File: `src/components/SettingsPage.tsx`**

Add input validation that:
- Warns if the URL doesn't start with `https://` or `http://`
- Auto-prepends `https://` if the user pastes a bare domain
- Shows a helper hint beneath the input if the URL looks incomplete (missing `/api/` path segment)

This prevents future "Invalid URL" errors from reaching the edge function.

### 3. Add defensive URL normalization in edge functions (code change)
**Files: `supabase/functions/test-webhook/index.ts` and `supabase/functions/publish-webhook/index.ts`**

Before calling `fetch(targetUrl)`, normalize the URL:
```typescript
if (targetUrl && !targetUrl.startsWith("http")) {
  targetUrl = "https://" + targetUrl;
}
```

This provides a safety net if the user forgets the protocol.

