
User picked Option 1 from my prior list: aggregate duplicate keyword rows in the "Top Keywords" chart.

Scope: only `src/components/AnalyticsDashboard.tsx`, the `keywordRankings` useMemo. Also fix the misleading title since the bar plots impressions, not position.

## Plan: De-duplicate Top Keywords chart

### Change
In `src/components/AnalyticsDashboard.tsx`, rewrite the `keywordRankings` memo to group rows by normalized keyword string (lowercased, trimmed), summing `impressions` and averaging `position`. Then sort by total impressions descending and take the top 10.

### Pseudocode
```ts
const map = new Map<string, { keyword: string; impressions: number; positions: number[] }>();
for (const k of keywords) {
  const key = k.keyword.trim().toLowerCase();
  const entry = map.get(key) ?? { keyword: k.keyword, impressions: 0, positions: [] };
  entry.impressions += k.impressions ?? 0;
  if (k.position) entry.positions.push(Number(k.position));
  map.set(key, entry);
}
return [...map.values()]
  .map(e => ({
    keyword: e.keyword.length > 30 ? e.keyword.slice(0, 30) + "…" : e.keyword,
    impressions: e.impressions,
    position: e.positions.length ? e.positions.reduce((a,b)=>a+b,0) / e.positions.length : 0,
  }))
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 10);
```

Also: the parent query currently does `.limit(20)` before dedup, which can drop duplicates of low-impression keywords. Bump the query to `.limit(200)` so aggregation has the full picture, then slice to 10 after grouping.

### Bonus fix
Rename the chart title from "Top Keywords by Position" to **"Top Keywords by Impressions"** — it actually plots impressions, so the current label is misleading.

### File touched
- `src/components/AnalyticsDashboard.tsx` (one query limit + one memo + one title string)

### Expected result
Each keyword appears exactly once in the bar chart, with its bar showing total impressions across all its tracked instances. Chart title accurately reflects what's plotted.
