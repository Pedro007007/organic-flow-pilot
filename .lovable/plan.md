

## Fix: DataForSEO Keyword Length Validation

### Problem
The credentials are now valid (no more 40100 error). However, DataForSEO's Google Ads Search Volume API rejects the entire request if **any single keyword exceeds 10 words**. The AI generates long-tail queries like "CRM software with best mobile app for small business owners on the go" (13 words), which causes the whole batch to fail with error 40501 -- returning 0 results for all queries.

### Solution
Two changes in the `llm-search` edge function:

1. **Filter out long keywords** before sending to DataForSEO -- remove any query with more than 10 words
2. **Instruct the AI to generate shorter queries** -- update the system prompt to cap queries at 8 words max

This ensures the API never rejects the batch, and real volume/CPC/competition data flows through.

### Technical Details

**File:** `supabase/functions/llm-search/index.ts`

- Update the AI system prompt to include: "Each query must be 8 words or fewer."
- In `fetchDataForSEOVolumes`, filter the keywords array to only include queries with 10 or fewer words before sending to the API
- Log any skipped keywords as warnings so they're visible in debugging

