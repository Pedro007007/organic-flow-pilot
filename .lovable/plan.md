

# Google Search Console OAuth Integration

This feature replaces the manual JSON upload with a proper OAuth flow so the app can automatically pull keyword and performance data from Google Search Console.

---

## What You'll Get

- A "Connect Google Search Console" button in Settings that kicks off Google's OAuth consent flow
- Automatic storage of OAuth tokens so GSC data can be pulled on-demand or on a schedule
- A "Sync Now" button to manually trigger a data pull after connecting
- The existing `gsc-ingest` edge function will be reused for processing the fetched data

---

## Prerequisites (You'll Add Later)

This integration requires two secrets from a Google Cloud project:
- **GSC_CLIENT_ID** -- OAuth 2.0 client ID
- **GSC_CLIENT_SECRET** -- OAuth 2.0 client secret

I'll build everything now and prompt you to add these secrets when you're ready. The UI will show a helpful "not configured" state until then.

---

## Implementation Steps

### 1. Database: Store OAuth Tokens

Create a new `gsc_connections` table to store per-user refresh tokens and connection status.

```text
Table: gsc_connections
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- refresh_token (text, encrypted at rest)
- access_token (text, nullable -- cached)
- token_expires_at (timestamptz, nullable)
- site_url (text -- the GSC property URL)
- connected_at (timestamptz)
- created_at (timestamptz)

RLS: Users can only read/update their own row.
```

### 2. Edge Function: `gsc-oauth`

A new edge function that handles two flows:

- **POST with `{ action: "get_auth_url" }`** -- Returns the Google OAuth consent URL. The redirect URI points back to the app with a code parameter.
- **POST with `{ action: "exchange_code", code: "..." }`** -- Exchanges the authorization code for tokens, stores the refresh token in `gsc_connections`, and returns success.
- **POST with `{ action: "sync" }`** -- Uses the stored refresh token to fetch fresh data from the GSC API, then processes it the same way `gsc-ingest` does (inserting into `performance_snapshots` and `keywords`).

The function reads `GSC_CLIENT_ID` and `GSC_CLIENT_SECRET` from backend secrets.

### 3. Update Settings Page UI

Replace the current static GSC endpoint documentation card with an interactive connection card:

- **Disconnected state**: Shows a "Connect Google Search Console" button
- **Connecting state**: After clicking, the user is redirected to Google's consent screen. On return, the code is exchanged automatically.
- **Connected state**: Shows the connected GSC property URL, a "Sync Now" button, and a "Disconnect" option
- Keep the manual JSON upload info as a fallback/alternative

### 4. Register the Edge Function

Add `gsc-oauth` to `supabase/config.toml` with `verify_jwt = false` (auth handled in code).

---

## Technical Details

### OAuth Flow

```text
User clicks "Connect GSC"
  -> Frontend calls gsc-oauth { action: "get_auth_url" }
  -> Edge function builds Google OAuth URL with:
     - scope: https://www.googleapis.com/auth/webmasters.readonly
     - redirect_uri: {app_origin}/settings?gsc_callback=true
     - access_type: offline (to get refresh_token)
  -> User is redirected to Google consent
  -> Google redirects back with ?code=...
  -> Frontend detects code param, calls gsc-oauth { action: "exchange_code", code }
  -> Edge function exchanges code for tokens, stores in gsc_connections
  -> UI updates to show "Connected"
```

### Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create `gsc_connections` table + RLS |
| `supabase/functions/gsc-oauth/index.ts` | Create -- handles auth URL, code exchange, and sync |
| `supabase/config.toml` | Update -- register `gsc-oauth` |
| `src/components/SettingsPage.tsx` | Update -- replace static GSC card with interactive OAuth card |
| `src/pages/Index.tsx` | Update -- handle `?gsc_callback=true` query param redirect to settings |

### Secrets Needed (later)

Two backend secrets will be requested when you're ready:
- `GSC_CLIENT_ID`
- `GSC_CLIENT_SECRET`

These come from the Google Cloud Console under APIs & Services > Credentials > OAuth 2.0 Client ID (Web application type), with the Search Console API enabled.

