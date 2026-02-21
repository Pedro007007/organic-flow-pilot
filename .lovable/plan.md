

## Fix: DataForSEO Zero Values and Improve Data Display

### What's Happening
1. Your screenshot (09:59) is from a run that **failed** before the word-length fix was deployed
2. The 10:02 run **succeeded** -- DataForSEO returned matches for all 15 queries
3. However, Google Ads often returns `search_volume: 0` for specific long-tail variations even when the API call succeeds -- this would show "0" instead of meaningful data

### Changes

**File: `supabase/functions/llm-search/index.ts`**

1. Add detailed logging of the first sample item's actual values (search_volume, cpc, competition_level) so we can see exactly what DataForSEO returns
2. Treat `search_volume: 0` as "no data" (set to `null`) so it falls back to the AI estimate tier instead of showing a misleading "0"
3. Same for `cpc: 0` -- treat as null so the UI shows a dash instead of "$0.00"

**File: `src/components/LlmSearchLab.tsx`**

4. Update `formatVolume` to show "< 10" when volume is 0 (if we keep 0 instead of nullifying)
5. Show competition level even when it's returned as 0 (e.g., "LOW" for zero competition)

### Technical Details

In the edge function's item mapping loop, change:
- `search_volume: item.search_volume ?? 0` to `search_volume: item.search_volume || null` (treats 0 as no data)
- `cpc: item.cpc ?? 0` to `cpc: item.cpc || null`
- `competition: item.competition ?? 0` to `competition: item.competition || null`

Add a log line after item parsing:
```
if (items.length > 0) {
  console.log("[DataForSEO] Sample item values:", JSON.stringify(items[0]).slice(0, 300));
}
```

This ensures that when DataForSEO returns zeros (meaning Google Ads has insufficient data for that exact phrase), the UI gracefully falls back to the AI-estimated tier label instead of showing misleading "0" values.
