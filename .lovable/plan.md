

## Real Keyword Data for LLM Search Lab

### The Problem
Currently, the LLM Search Lab uses AI-estimated volume tiers ("high", "medium", "low") -- these are guesses, not real data. You need actual search volume numbers, CPC, and competition scores.

### The Solution
Integrate **DataForSEO API** into the `llm-search` backend function. After the AI generates research queries, each query gets enriched with real Google Ads keyword data before being returned to the UI.

DataForSEO is an affordable keyword data provider that gives you the same data Google Ads Keyword Planner provides: exact monthly search volume, CPC, competition level, and monthly trends.

### What Changes

**1. Add DataForSEO API credentials (secret)**
- You'll need a DataForSEO account (https://app.dataforseo.com)
- A `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` secret will be added to the project
- These are used for Basic Auth against their API

**2. Update `llm-search` edge function**
After the AI generates queries, add a second step:
- Batch all generated queries (up to 1000 per request) into a single DataForSEO call to `POST /v3/keywords_data/google_ads/search_volume/live`
- Enrich each query result with real metrics: `search_volume` (exact number), `cpc` (cost per click in USD), `competition` (0-1 score), `competition_level` ("LOW"/"MEDIUM"/"HIGH"), and `monthly_searches` (last 12 months trend)
- Fall back to AI estimates if DataForSEO credentials are not configured (graceful degradation)

**3. Update `LlmSearchLab.tsx` UI**
- Replace the vague "Volume" column with real numbers: show actual monthly search volume (e.g., "12,400") instead of "high/medium/low"
- Add a CPC column showing cost-per-click data
- Add a Competition indicator
- Show monthly trend sparkline or mini bar chart for the last 12 months
- Update the "Add to Keywords" action to store real volume data

**4. Update `QueryResult` interface and keyword insert**
- Add `search_volume`, `cpc`, `competition`, `competition_level`, `monthly_searches` fields
- When adding a keyword, store the real volume data in the `keywords` table

### Data Flow

```text
User enters topic
      |
      v
AI generates 10-20 research queries (intent, reasoning)
      |
      v
DataForSEO API enriches each query with real metrics
  - search_volume: 12,400
  - cpc: $3.42
  - competition: 0.67 (HIGH)
  - monthly_searches: [8200, 9100, 11000, 12400, ...]
      |
      v
Cross-reference against user's keywords table
      |
      v
Display enriched results with real data
```

### Files Changed

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/llm-search/index.ts` | Modify | Add DataForSEO API call after AI query generation; enrich results with real volume, CPC, competition |
| `src/components/LlmSearchLab.tsx` | Modify | Show real search volume numbers, CPC, competition level; update interfaces and table columns |

### Prerequisites
- A DataForSEO account (free trial available at https://app.dataforseo.com)
- You'll be prompted to enter your DataForSEO login and password as secrets

### Cost
DataForSEO charges approximately $0.075 per search volume request (per batch of keywords). Each LLM Search session would cost roughly $0.075 since all queries go in one batch.

