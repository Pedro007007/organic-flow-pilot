

## Problem

The `publish-webhook` edge function has a bug: it reads `webhookUrl` from the **request body** (line 30), but the AgentPipeline only sends `{ contentItemId, keyword }` — no `webhookUrl`. The function also reads `webhook_secret` and `revalidation_prefix` from `user_settings`, but **never reads `webhook_url` from settings** as a fallback.

This means the webhook URL is always empty when triggered from the pipeline, so the function skips the actual webhook call and returns `{ status: "no_webhook_configured" }`. The content gets marked as "published" in the database, but **no request is ever sent to your Vercel endpoint**.

Meanwhile, `test-webhook` works correctly because it reads `webhook_url` from `user_settings`.

## Fix

**1 file change: `supabase/functions/publish-webhook/index.ts`**

Update the settings query on line 37 to also select `webhook_url`:
```sql
.select("webhook_url, webhook_secret, revalidation_prefix")
```

Then update line 140 to fall back to the saved URL:
```typescript
const targetUrl = webhookUrl || settings?.webhook_url || "";
```

This way, when triggered from the AgentPipeline (no `webhookUrl` in body), it uses the saved setting. When called with an explicit URL in the body, that takes priority.

## Summary

- **Root cause**: `publish-webhook` never reads the saved `webhook_url` from `user_settings`
- **Impact**: Publishing agent marks content as published but never actually calls your Vercel API route
- **Fix**: One line to add `webhook_url` to the select query, one line to use it as fallback

