

## Fix: Optimization Score "Content item not found" Error

### Root Cause

The `optimization-score` edge function queries `content_items` with **two filters**: `.eq("id", contentItemId)` AND `.eq("user_id", userId)`. However, the `ContentDetail` component fetches content items using only `.eq("id", contentId)` -- relying on RLS (which includes an admin role check). This mismatch means:

- If an admin user views someone else's content item, ContentDetail loads it fine (RLS allows it), but the optimization scan fails because the edge function's explicit `user_id` check doesn't match.
- If a session token is slightly stale or the user ID resolution differs, the same issue occurs.

### Fix

**1. Update `optimization-score` edge function** -- Remove the redundant `.eq("user_id", userId)` filter when fetching the content item. Instead, rely on the Supabase client (which carries the user's auth token) and RLS to enforce access control. This aligns with how every other edge function in the project works.

```
// Before (line ~43-47 of optimization-score/index.ts):
.eq("id", contentItemId)
.eq("user_id", userId)

// After:
.eq("id", contentItemId)
```

Keep the `user_id` for the `optimization_jobs` insert (that's correct -- the job belongs to the user running it).

**2. Same fix for the brand lookup** -- The brand query also uses `.eq("user_id", userId)` which is fine since brands are user-owned, but this is unrelated to the bug.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/optimization-score/index.ts` | Remove `.eq("user_id", userId)` from content_items query (line 45), keep RLS-based access control |

### Why This Fixes It

- RLS on `content_items` already enforces `auth.uid() = user_id OR has_role(auth.uid(), 'admin')`.
- The edge function creates a Supabase client with the user's JWT, so RLS applies automatically.
- Removing the redundant filter lets admins and regular users both use the scan without conflict.

