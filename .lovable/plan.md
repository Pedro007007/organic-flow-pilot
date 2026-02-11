

## Fix: GSC OAuth callback not completing

### Problem
After authorizing with Google, the browser redirects to `/?gsc_callback=true&code=...`. This loads the **Landing page** (public marketing page), but the code that processes the OAuth callback lives in `GscConnectionCard` on the `/dashboard` page. The callback code is never executed, so the connection never completes.

### Solution
Add a redirect in `App.tsx` (or a small wrapper component) that detects GSC callback parameters on the `/` route and forwards them to `/dashboard`, where the existing handler will pick them up and complete the connection.

### Technical Details

**File: `src/pages/Landing.tsx`**

Add a `useEffect` at the top of the Landing component that checks for `?gsc_callback=true&code=...` in the URL. If found, redirect to `/dashboard` with the same query parameters so the existing handler in `GscConnectionCard` can process the OAuth code.

```typescript
// At the top of the Landing component:
const navigate = useNavigate();

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("gsc_callback") === "true" && params.get("code")) {
    navigate(`/dashboard?${params.toString()}`, { replace: true });
  }
}, [navigate]);
```

This requires adding `useNavigate` to the imports from `react-router-dom` and `useEffect` from `react`.

**No other files need to change.** The existing `useEffect` in `GscConnectionCard.tsx` will handle the code exchange once the user lands on `/dashboard` with the callback parameters.

### Why this works
- Google redirects to `/?gsc_callback=true&code=ABC123`
- Landing page detects the callback params and immediately redirects to `/dashboard?gsc_callback=true&code=ABC123`
- The `ProtectedRoute` wrapper ensures the user is authenticated
- `GscConnectionCard`'s existing `useEffect` picks up the `code` and `gsc_callback` params and exchanges the code for tokens

