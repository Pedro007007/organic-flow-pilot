

# AI SEO Growth Engine — Phase 1 Buildout Plan

## Architecture Summary

```text
+----------------------------------+          +-------------------------+
|     LOVABLE (Control Plane)      |          |   NEXT.JS (Phase 2)     |
|                                  |          |                         |
|  Dashboard UI (done)             |   API    |  SSR/ISR blog pages     |
|  Agent Pipeline (done)           | -------> |  Schema/sitemap         |
|  Content Pipeline (done)         | webhook  |  Public SEO content     |
|  Keyword Table (done)            |          |                         |
|                                  | <------- |                         |
|  Lovable Cloud:                  |  GSC/GA  |                         |
|    - Supabase DB                 |  data    |                         |
|    - Edge Functions              |          |                         |
|    - Auth                        |          |                         |
+----------------------------------+          +-------------------------+
```

## What We Build Now (Phase 1)

Phase 1 focuses entirely on making the Lovable control plane production-ready with a real backend. Next.js integration comes in Phase 2.

### Step 1: Enable Lovable Cloud + Database Schema

Set up Supabase tables for:
- **keywords** — store discovered keyword opportunities, intent, scores
- **content_items** — articles with status, metadata, SEO fields, drafts
- **agent_runs** — log of each agent execution (status, timestamps, results)
- **performance_snapshots** — periodic GSC/GA data per page

Add RLS policies so data is secure.

### Step 2: Auth + Roles

Enable Supabase auth with email login. Add a `profiles` table with role field (admin / operator / viewer). Gate dashboard access behind login.

### Step 3: Edge Functions for Agent Orchestration

Create edge functions that simulate (and later execute) each agent:
- `keyword-discovery` — accepts GSC data, returns scored opportunities
- `content-strategy` — takes keyword, returns outline + title options
- `content-generate` — takes outline, returns draft markdown
- `seo-optimize` — takes draft, returns meta/schema/slug
- `publish-webhook` — sends payload to external CMS/Next.js (Phase 2 hook)
- `monitor-refresh` — checks performance data, flags refresh candidates

Each function logs its run to `agent_runs` table.

### Step 4: Wire Dashboard to Real Data

Replace mock data with Supabase queries:
- Metrics cards pull from `performance_snapshots`
- Keyword table pulls from `keywords`
- Content pipeline pulls from `content_items`
- Agent pipeline pulls from `agent_runs`

### Step 5: Content Workflow with Approval Gates

Add ability to:
- View agent-generated content drafts
- Edit metadata (title, slug, schema)
- Approve or reject before "publishing"
- Move content between pipeline stages

### Step 6: Webhook System (Phase 2 Preparation)

Build a generic `publish-webhook` edge function that:
- Takes approved content + SEO metadata
- POSTs to a configurable external URL
- Logs the response
- This becomes the bridge to Next.js or any CMS

## Phase 2 (Future — Not Built Now)

- Stand up Next.js project on Vercel
- Create API route to receive content webhooks
- ISR revalidation on publish
- GSC API integration for real performance data
- Feed data back into Lovable dashboard

## Why This Order

1. Backend-first means your dashboard becomes functional, not just visual
2. Edge functions create the agent API layer that Next.js will consume later
3. The webhook pattern means you can plug in ANY publishing target — Next.js, WordPress, Webflow, anything
4. You can demo and sell Phase 1 as a standalone "AI SEO Command Center" before Phase 2 exists

