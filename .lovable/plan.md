
## Clean Up All Fake Data

### The Problem
The platform currently shows fabricated numbers when no real data exists. Three locations inject mock/fake data as fallbacks, making the dashboard look active when it isn't.

### What's Already Real (No Changes Needed)
- Keywords table, Content Pipeline, Rankings, Checklists, LLM Search Lab, Brands, Leads, Reports, Scanner, Analytics Dashboard, Team -- all pull from the database. These are clean.

### What's Fake (Needs Removing)

**1. Mock Data File: `src/data/mockData.ts`**
Contains invented metrics (284,391 impressions, 12,847 clicks), 6 fake keywords, 6 fake content items, and 8 fake agent statuses. This entire file will be deleted.

**2. Dashboard Fallbacks: `src/pages/Index.tsx`**
Lines 38-41 fall back to mock data when the database is empty:
- `displayMetrics = metrics?.length ? metrics : mockMetrics` -- shows fake 284K impressions
- `displayKeywords = keywords?.length ? keywords : mockKeywords` -- shows fake keywords
- `displayAgents = agents?.length ? agents : mockAgents` -- shows fake agent activity

These will be replaced with empty arrays so the dashboard shows real empty states.

**3. Hook Fallbacks: `src/hooks/useDashboardData.ts`**
- `usePerformanceMetrics` returns `mockMetrics` when no snapshots exist
- `useAgentRuns` returns `mockAgents` when no agent runs exist

These will return empty arrays instead.

### What Users Will See After Cleanup
When there's no real data, users will see clean empty states instead of fake numbers. The dashboard will show zeros / "no data yet" messaging. Once they connect Google Search Console, run agents, or add keywords, real data populates naturally.

### Technical Changes

| File | Change |
|------|--------|
| `src/data/mockData.ts` | Delete entire file |
| `src/pages/Index.tsx` | Remove mock import; replace fallbacks with empty arrays |
| `src/hooks/useDashboardData.ts` | Remove mock import; return empty arrays instead of mock fallbacks |

### Empty State Handling
The agent pipeline already has a default agent list built into `useAgentRuns` (6 agents with "idle" / "never" status), so the agent cards will still render -- they'll just show real idle states rather than pretending agents ran recently. Metrics and keywords will show as empty until real data arrives.
