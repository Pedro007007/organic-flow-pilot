

## Proper Next.js ISR/SSR Integration Setup

### Architecture Overview

Your system uses a **split architecture**:

- **Control Plane** (this Lovable app) -- manages content, agents, and triggers publishing
- **Publishing Plane** (separate Next.js project on Vercel) -- renders SEO-friendly public pages using ISR/SSR

Lovable **cannot build Next.js apps** -- it only supports React/Vite. So the Next.js project lives elsewhere (typically deployed on Vercel). What we build here is making the Control Plane a **proper ISR-aware webhook sender**.

### What Currently Exists

- A `publish-webhook` edge function that POSTs content JSON to a configurable URL
- A Settings page with a webhook URL field
- Content items with title, slug, content, meta, keywords

### What's Missing

1. **Webhook authentication** -- no shared secret token to verify requests on the Next.js side
2. **Revalidation headers** -- no `x-revalidate-path` or `x-revalidate-tag` headers for ISR on-demand revalidation
3. **Webhook secret management** -- no UI to configure and store a secret token
4. **Richer payload** -- missing structured data (schema JSON-LD, OG image, canonical URL) that Next.js pages need
5. **Webhook test button** -- no way to verify the connection works before publishing
6. **Next.js starter guide** -- no in-app documentation showing users how to set up their Next.js receiving endpoint

### Changes

**1. Settings Page (`src/components/SettingsPage.tsx`)**
- Add a "Webhook Secret" field alongside the existing webhook URL
- Add a "Revalidation Path Prefix" field (e.g., `/blog`) so ISR knows which paths to revalidate
- Add a "Test Connection" button that sends a ping to the webhook and shows success/failure
- Save webhook secret to `user_settings` table

**2. Database Migration**
- Add `webhook_secret` column to `user_settings` table
- Add `revalidation_prefix` column to `user_settings` table

**3. Publish Webhook Edge Function (`supabase/functions/publish-webhook/index.ts`)**
- Read `webhook_secret` and `revalidation_prefix` from `user_settings`
- Include authentication headers in the webhook POST:
  - `x-webhook-secret`: shared secret for the Next.js API route to verify
  - `x-revalidate-path`: computed path (e.g., `/blog/my-post-slug`)
  - `x-revalidate-tag`: content tag for tag-based revalidation
- Enrich the payload with:
  - `revalidatePath`: the full path to revalidate
  - `action`: `"publish"` or `"unpublish"` or `"update"`
  - `publishedAt` / `updatedAt` timestamps

**4. New "Test Webhook" Edge Function (`supabase/functions/test-webhook/index.ts`)**
- Sends a test ping to the configured webhook URL with the secret
- Returns success/failure and response status to the UI
- Payload: `{ action: "ping", timestamp: "..." }`

**5. Next.js Setup Guide Component (`src/components/NextJsSetupGuide.tsx`)**
- A collapsible guide section in Settings showing:
  - How to create the `/api/publish` route in Next.js
  - How to verify the webhook secret
  - How to call `revalidatePath()` or `revalidateTag()`
  - Example code snippets users can copy

### Technical Details

**Enhanced webhook payload structure:**
```text
Headers:
  Content-Type: application/json
  x-webhook-secret: <user's configured secret>
  x-revalidate-path: /blog/my-post-slug
  x-revalidate-tag: content-item-<id>

Body:
{
  "action": "publish",
  "revalidatePath": "/blog/my-post-slug",
  "title": "...",
  "seo_title": "...",
  "meta_description": "...",
  "slug": "my-post-slug",
  "content": "...",
  "keyword": "...",
  "schema_types": [...],
  "publishedAt": "2026-02-11T...",
  "updatedAt": "2026-02-11T..."
}
```

**Database migration SQL:**
```text
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS webhook_secret text DEFAULT '',
  ADD COLUMN IF NOT EXISTS revalidation_prefix text DEFAULT '/blog';
```

**Files to create/modify:**
- `src/components/SettingsPage.tsx` -- add secret field, prefix field, test button, setup guide
- `src/components/NextJsSetupGuide.tsx` -- new collapsible guide with code snippets
- `supabase/functions/publish-webhook/index.ts` -- add secret headers, revalidation headers, enriched payload
- `supabase/functions/test-webhook/index.ts` -- new edge function for connection testing
- Database migration for new columns

