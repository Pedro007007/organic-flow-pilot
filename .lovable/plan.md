

# Fix: GSC OAuth Exchange Code Error Handling

## Problem
The `exchange_code` call to the edge function is returning a non-2xx status, but the actual error reason (e.g., invalid code, redirect_uri mismatch at Google's token endpoint, etc.) is hidden because:
1. The edge function doesn't log enough detail during the token exchange
2. The frontend uses `error?.message` from `supabase.functions.invoke`, which only says "Edge Function returned a non-2xx status code" -- the actual response body with the real error is lost

## Changes

### 1. Update `supabase/functions/gsc-oauth/index.ts` -- Add detailed logging

Add `console.log` / `console.error` statements in the `exchange_code` action so we can see in the function logs exactly what Google's token endpoint returns:

```typescript
// In the exchange_code block, after fetching the token:
console.log("exchange_code: tokenRes status", tokenRes.status);
console.log("exchange_code: tokenData", JSON.stringify(tokenData));
```

Also add logging around the database insert to catch any failures there.

### 2. Update `src/components/GscConnectionCard.tsx` -- Extract real error from response

The `supabase.functions.invoke` method puts the response body in `error.context` when non-2xx. Update `handleExchangeCode` to extract the actual error message:

```typescript
const handleExchangeCode = async (code: string) => {
  setConnecting(true);
  const redirectUri = `${window.location.origin}${window.location.pathname}?gsc_callback=true`;
  const { data, error } = await supabase.functions.invoke("gsc-oauth", {
    body: { action: "exchange_code", code, redirect_uri: redirectUri },
  });
  setConnecting(false);

  if (error) {
    // Try to extract real error message from the response
    let errorMessage = error.message;
    try {
      const errorBody = await error.context?.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch {}
    toast({ title: "Connection failed", description: errorMessage, variant: "destructive" });
    return;
  }

  if (!data?.success) {
    toast({ title: "Connection failed", description: data?.error || "Unknown error", variant: "destructive" });
    return;
  }

  toast({ title: "Google Search Console connected!", description: data.site_url || "Ready to sync" });
  fetchStatus();
};
```

## Why This Will Help
- The edge function logs will reveal the exact error from Google (expired code, wrong redirect_uri, invalid credentials, etc.)
- The frontend toast will show the actual error message instead of the generic "non-2xx" text
- Once we see the real error, we can fix the root cause in a follow-up step

