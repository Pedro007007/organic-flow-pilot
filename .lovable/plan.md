

# Analysis: Current Searchera Infrastructure vs. Your Upgrade Prompt

## Summary

You already have roughly **75-80% of the core infrastructure** in place. Your prompt describes 15 prompts worth of features -- here's an honest mapping of what exists, what's partially done, and what's genuinely new.

---

## What You Already Have (No Changes Needed)

| Prompt | Feature | Current Status |
|--------|---------|----------------|
| P1 | Split architecture (Control Plane + Publishing Plane) | Done -- Lovable (React/Vite) as Control Plane, Next.js setup guide + webhook publishing built |
| P2 (partial) | Database schema | Done via Lovable Cloud -- `content_items`, `keywords`, `agent_runs`, `rankings`, `ai_citations`, `seo_fulfilment`, `seo_checklists`, `notifications`, `user_settings`, `profiles`, `user_roles`, `team_invites`, `report_settings`, `report_leads`, `competitor_scans`, `performance_snapshots`, `gsc_connections` |
| P3 | AI Service Layer | Done -- All edge functions use Lovable AI Gateway (Gemini + GPT models) with proper tool calling |
| P4 | Firecrawl (SERP scraping) | Done -- `serp-research` function uses Firecrawl Search API |
| P5 (partial) | Real-time progress | Done -- Supabase Realtime subscriptions for live dashboard updates |
| P6 | Research Agent (Gemini function calling) | Done -- `serp-research` uses Gemini tool calling to return structured `common_headings`, `content_gaps`, `competitor_weaknesses`, `faq_questions`, `unique_angles` |
| P7 | Image Generation | Done -- `generate-hero-image` (Nano Banana) + 2 in-body images during `content-generate` |
| P8 | Article Writer (AI) | Done -- `content-generate` with SERP-informed writing, internal links, image placeholders |
| P9 (partial) | Meta + SEO | Done -- `seo-optimize` generates `meta_title`, `meta_description`, `slug`, `schema_types` |
| P10 | Pipeline Orchestrator | Done -- Autopilot in `ContentPipeline.tsx` runs: SERP Research -> Strategy -> Generate -> Hero Image -> SEO -> Publish sequentially |
| P11 (partial) | API Routes | Done as edge functions: `content-generate`, `content-strategy`, `serp-research`, `seo-optimize`, `publish-webhook`, `keyword-discovery`, `monitor-refresh`, `generate-hero-image`, `content-rewrite`, `rankings-check`, `fulfilment-scan`, `business-scanner`, `gsc-oauth`, `gsc-ingest`, `checklist-verify`, `send-digest`, `test-webhook` |
| P12 | Dashboard | Done -- Performance metrics, Agent Pipeline, Content Pipeline, Keyword Table, all with real-time data |
| P13 | Content Detail Page | Done -- Edit/preview tabs, markdown rendering, SERP research panel, SEO meta display |
| P14 (partial) | Optimization flow | Partial -- `content-rewrite` does rewrite/expand/shorten. `business-scanner` scans competitor domains. No dedicated "optimization job" with scoring/action plan UI yet |

---

## What's Missing or Needs Enhancement

### 1. Brand Management (NOT BUILT -- This is the biggest gap)
Your prompt's `Brand` model is **completely absent**. Currently, the system has no concept of:
- Brand tone of voice / writing preferences
- Brand-specific SEO settings
- Brand image defaults
- Brand-specific internal linking config
- Research depth per brand

**What this means:** Every content piece is generated with a generic system prompt. There's no way to customise the writing style, tone, or visual identity per client/brand.

**Enhancement:** Add a `brands` table and a Brand Management UI with tabs for General, Voice/Style, SEO Settings, Internal Linking, Image Defaults. Wire brand settings into `content-generate`, `seo-optimize`, and `generate-hero-image` edge functions so each piece of content respects the brand's personality.

### 2. Sitemap Sync (NOT BUILT)
No `SitemapPage` table or sitemap crawl logic. Your system has internal linking based on existing `content_items` URLs, but there's no way to import a full sitemap from an external site to power smarter internal linking.

**Enhancement:** Add a `sitemap_pages` table, a `sync-sitemap` edge function that fetches and parses XML sitemaps, and surface these pages as internal link candidates during content generation.

### 3. Optimization Job with Scoring (PARTIAL)
You have `content-rewrite` and `business-scanner`, but no dedicated flow where you:
- Input a URL
- Scrape it
- Detect target keyword
- Run competitor research
- Generate a score, weaknesses, action plan, and optimized rewrite

**Enhancement:** Create a dedicated `optimization-jobs` table and `optimize-page` edge function that combines scraping (Firecrawl) + competitor analysis + AI scoring into a single structured workflow with a UI to view results.

### 4. Content Repurposing (NOT BUILT)
No LinkedIn or YouTube repurposing endpoints exist.

**Enhancement:** Add a `content-repurpose` edge function that takes a content item ID and a target format (linkedin/youtube/twitter) and uses AI to transform the article into platform-specific formats.

### 5. SSE Streaming for Pipeline Progress (NOT BUILT)
Currently, the Autopilot pipeline fires sequential toasts. There's no Server-Sent Events stream showing real-time step-by-step progress with percentages.

**Enhancement:** This is a nice-to-have but complex within the current architecture. The current toast-based approach works. An alternative is to poll `agent_runs` status via Supabase Realtime (which you already have enabled) rather than adding SSE infrastructure.

### 6. Batch Job Processing (NOT BUILT)
No "Generate All Idle" button or batch processing queue. Currently you can bulk-change status but can't bulk-run Autopilot.

**Enhancement:** Add a batch endpoint and UI button that queues multiple content items for sequential Autopilot processing.

### 7. Thumbnail Concept (PARTIAL)
Hero image generation exists, but there's no separate "thumbnail" step where AI generates a concept description first and then creates the image from it.

**Enhancement:** Minor -- could add a two-step process in `generate-hero-image` where Gemini first describes the ideal image concept, then passes that to Nano Banana. Low priority.

---

## Recommended Priority Order for Enhancements

1. **Brand Management** -- Highest impact. Transforms generic content into brand-specific output. This is the backbone for multi-tenant/multi-client use.
2. **Sitemap Sync** -- Enables smarter internal linking across an entire domain, not just published content items.
3. **Optimization Job with Scoring** -- Adds a powerful "audit and fix" workflow for existing pages.
4. **Content Repurposing** -- Quick win. LinkedIn/YouTube/Twitter reformatting from existing articles.
5. **Batch Processing** -- Quality of life improvement for power users.
6. **SSE Streaming** -- Low priority given Realtime already works for status updates.

---

## Technical Notes

- The prompt references Prisma + PostgreSQL -- you already have PostgreSQL via Lovable Cloud with proper RLS policies on every table. No migration needed.
- The prompt references Vercel + Next.js Route Handlers -- your current split architecture already accounts for this. The Next.js Setup Guide in Settings provides the exact `app/api/publish/route.ts` code. The Next.js side is meant to be a separate project deployed on Vercel.
- The prompt references "FAL AI" for image generation -- you already use Nano Banana (Gemini image model) which is native to your AI gateway. No additional API key needed.
- The prompt references "Claude" for writing -- you use Gemini via Lovable AI Gateway, which achieves the same result without additional API keys.
- All edge functions already have proper auth, error handling, rate limit handling (429/402), and agent run logging.

