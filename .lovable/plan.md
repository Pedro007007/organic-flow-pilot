

## Fix: DataForSEO Integration Not Returning Real Data

### The Problem
The LLM Search Lab returns results but all Volume, CPC, Competition, and Trend columns show dashes with "est." labels. The DataForSEO API call is silently failing -- there are zero DataForSEO-related entries in the edge function logs.

### Root Cause (Most Likely)
The `fetchDataForSEOVolumes` function silently returns an empty map when:
1. The `DATAFORSEO_LOGIN` or `DATAFORSEO_PASSWORD` secrets are empty/placeholder values, OR
2. The API call fails but the error is swallowed, OR  
3. The API returns data in a different structure than expected

The current code has no logging to diagnose which case it is.

### The Fix

**File: `supabase/functions/llm-search/index.ts`**

Add diagnostic logging throughout the DataForSEO flow so we can see exactly where it fails:

1. Log whether credentials are found (without revealing them)
2. Log the number of queries being sent
3. Log the API response status
4. Log how many results came back
5. Log if any query-to-result matching succeeded

Additionally, ensure the function handles edge cases:
- DataForSEO may return results under a slightly different key structure
- The keyword matching is case-sensitive and exact -- add fuzzy matching fallback

### Action Items

After deploying the updated function with logging:
- Run a search again
- Check the edge function logs to see exactly where the data flow breaks
- If the credentials are the issue, you'll need to re-enter valid DataForSEO credentials

### Technical Changes

| File | Change |
|------|--------|
| `supabase/functions/llm-search/index.ts` | Add `console.log` at each stage of DataForSEO flow: credential check, request sent, response status, result count, enrichment count. Also improve error surface so failures are visible in the response payload (add a `data_warnings` field). |

