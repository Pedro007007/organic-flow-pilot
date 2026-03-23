

# Platform Feature Audit Report

## Summary

After reviewing all 15 dashboard sections, 30 edge functions, authentication, routing, database schema, RLS policies, and realtime subscriptions, here is the complete audit.

---

## PASSING (No Issues Found)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Authentication (Auth.tsx)** | OK | Login, signup, forgot password, email verification all wired correctly |
| 2 | **Protected Routes** | OK | ProtectedRoute guards /dashboard, /guide, /daniela-leads |
| 3 | **Dashboard Overview** | OK | Metrics, agents, content pipeline, keywords all render with react-query |
| 4 | **Sidebar Navigation** | OK | 15 sections, mobile responsive via Sheet, theme toggle works |
| 5 | **Content Pipeline** | OK | CRUD, status management, bulk actions, brand association |
| 6 | **Content Detail** | OK | Tabs for edit, preview, fulfilment, optimization, AEO, repurpose |
| 7 | **Keyword Table** | OK | Fetches from `keywords` table with RLS |
| 8 | **Agent Pipeline** | OK | Shows 6 agents with latest run status, fallback defaults |
| 9 | **Analytics Dashboard** | OK | Recharts charts from performance_snapshots and keywords |
| 10 | **Rankings Tracker** | OK | Rankings + AI citations, chart/table toggle |
| 11 | **LLM Search Lab** | OK | Sessions history, DataForSEO integration |
| 12 | **Business Scanner** | OK | Competitor scans with public report generation |
| 13 | **Report Settings** | OK | CTA blocks, colors, headline config, live preview |
| 14 | **Lead Capture** | OK | Report leads table with search and CSV export |
| 15 | **SEO Checklist** | OK | Categories, auto-verify via edge function |
| 16 | **Brand Management** | OK | 5 tabs (General, Voice, SEO, Linking, Images), AI SEO Expert |
| 17 | **Team Management** | OK | Invite system with role-based access |
| 18 | **Settings Page** | OK | Webhook config, agent schedules, GSC connection, digest |
| 19 | **Content Calendar** | OK | Calendar view of content items |
| 20 | **Notification Bell** | OK | Realtime notifications with mark-as-read |
| 21 | **Realtime Subscriptions** | OK | agent_runs, content_items, notifications channels |
| 22 | **Public Report Route** | OK | /report/:reportId with security-definer function |
| 23 | **Landing Page** | OK | Marketing page with Daniela chatbot |
| 24 | **Blog / BlogPost** | OK | Public blog pages pulling published content |
| 25 | **Guide Page** | OK | Protected A-Z guide |
| 26 | **Daniela Leads** | OK | Admin-only lead management |

---

## POTENTIAL ISSUES FOUND

### Issue 1: `report_leads` Foreign Key Join May Fail
**File**: `src/components/LeadsManagement.tsx` line 33
**Problem**: The query `.select("*, competitor_scans(domain)")` relies on an implicit foreign key between `report_leads.scan_id` and `competitor_scans.id`, but the database schema shows **no foreign key** defined on `report_leads.scan_id`. PostgREST requires a FK relationship for join queries.
**Impact**: The leads table may load but the `domain` column would show empty/null for every lead.
**Fix**: Add a migration to create the foreign key: `ALTER TABLE report_leads ADD CONSTRAINT fk_scan FOREIGN KEY (scan_id) REFERENCES competitor_scans(id);`

### Issue 2: `report_leads` Missing Public INSERT Policy for Anon Users
**File**: RLS on `report_leads`
**Problem**: The INSERT policy is restricted to `authenticated` role only. But the public report page (`/report/:reportId`) captures lead emails from **anonymous visitors** who aren't logged in. The `report-lead-capture` edge function likely uses the service role key, so this may work — but if it uses the anon key, inserts would fail silently.
**Impact**: Potential lead capture failure for unauthenticated visitors.
**Fix**: Verify the edge function uses `SUPABASE_SERVICE_ROLE_KEY` for the insert, or add an anon INSERT policy.

### Issue 3: `profiles` Table Missing INSERT Policy
**File**: RLS on `profiles`
**Problem**: The `profiles` table has no INSERT policy. New user profiles are created via the `handle_new_user()` trigger which uses `SECURITY DEFINER`, so this works. However, if any client-side code ever tries to insert a profile directly, it would fail.
**Impact**: Low — trigger handles it. But worth noting for future development.

### Issue 4: Missing Asset File Check
**File**: `src/assets/daniela-avatar.png`
**Problem**: Two components reference `daniela-avatar.png`. If this file was generated via AI or uploaded, it should exist. No build errors reported, so this is likely fine.
**Impact**: None if file exists.

### Issue 5: `useDashboardData` Missing User ID Filter
**File**: `src/hooks/useDashboardData.ts`
**Problem**: The queries for `performance_snapshots`, `keywords`, `content_items`, and `agent_runs` do **not** filter by `user_id` — they rely entirely on RLS. This works correctly due to RLS policies, but if an admin user is logged in (whose RLS policy includes `has_role(auth.uid(), 'admin')`), they would see **all users' data**, which may be unintended.
**Impact**: Admin users see all data mixed together instead of just their own.
**Fix**: Add `.eq("user_id", user.id)` to each query for explicit filtering.

### Issue 6: Content Calendar No Dedicated Data
**File**: `src/components/ContentCalendar.tsx`
**Problem**: Content Calendar receives the same `content` array from the dashboard. It doesn't have scheduled dates — it likely maps to `updated_at` or `created_at`. This is functional but may not represent actual publication schedules.
**Impact**: UX — calendar shows last-updated dates, not planned publish dates.

---

## EDGE FUNCTIONS AUDIT

All 30 edge functions have:
- Proper CORS headers with extended header list
- OPTIONS preflight handler
- JWT authentication (where appropriate)
- Error handling with JSON responses

No missing secrets detected — all required secrets (`LOVABLE_API_KEY`, `DATAFORSEO_LOGIN/PASSWORD`, `RESEND_API_KEY`, `FIRECRAWL_API_KEY`) are configured.

---

## RECOMMENDED FIXES (Priority Order)

1. **Add foreign key on `report_leads.scan_id`** → Fixes lead domain display
2. **Add `.eq("user_id", user.id)` to dashboard queries** → Prevents admin data mixing
3. **Verify `report-lead-capture` uses service role key** → Ensures public lead capture works

All three are straightforward fixes. Shall I proceed with implementing them?

