

# Fix: GSC OAuth Callback Fails Due to Auth Race Condition

## Problem
When Google redirects back to the app with the authorization code, the page does a full reload. The `useEffect` that detects the `?code=` parameter fires immediately on component mount, **before the auth session is restored from localStorage**. This means the call to the `gsc-oauth` edge function has no auth token, causing a 401 "Unauthorized" error (the "non-2xx status code" you see in the toast).

## Solution
Make the OAuth callback `useEffect` wait for the `user` to be loaded before attempting the code exchange.

## Changes

### 1. Update `src/components/GscConnectionCard.tsx`

Modify the OAuth callback `useEffect` to depend on `user` so it only fires once the auth session is ready:

```typescript
// Handle OAuth callback — wait for user to be available
useEffect(() => {
  if (!user) return; // Wait for auth session to restore

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const gscCallback = params.get("gsc_callback");

  if (code && gscCallback === "true") {
    window.history.replaceState({}, "", window.location.pathname);
    handleExchangeCode(code);
  }
}, [user]); // Add user dependency
```

This is a one-line addition (`if (!user) return;`) and a dependency array change (`[]` to `[user]`). No other files need to change.

## Why This Works
- On redirect back from Google, the component mounts but `user` is initially `null`
- The `useAuth` hook restores the session from localStorage (takes a moment)
- Once `user` is populated, the effect re-runs, finds the `?code=` param, and calls `handleExchangeCode` with a valid auth token
- The edge function receives the token and successfully exchanges the Google authorization code for tokens

