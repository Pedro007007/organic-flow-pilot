

## Optimization Jobs — AI-Driven Content Scoring and Action Plans

Add a new "Optimization Jobs" system that scores existing content items against SEO best practices and generates prioritized action plans for improvement.

### Overview

This feature introduces a dedicated scoring engine that analyzes published/monitored content and produces a structured SEO score (0-100) with a breakdown across key dimensions, plus a concrete action plan. Users can trigger optimization scans from the Content Detail view or run them in bulk from a new sidebar section.

### What Gets Built

**1. Database: `optimization_jobs` table**

Stores each optimization scan result:
- `id`, `user_id`, `content_item_id` (FK to content_items)
- `overall_score` (integer 0-100)
- `scores` (JSONB — breakdown by dimension: technical, on_page, readability, keyword_usage, internal_links)
- `action_plan` (JSONB — array of prioritized actions with effort/impact labels)
- `status` (pending, running, completed, error)
- `created_at`, `completed_at`
- RLS: users can only see their own jobs

**2. Edge function: `supabase/functions/optimization-score/index.ts`**

- Accepts `contentItemId` (required)
- Fetches the content item's draft, SEO metadata, keyword, brand settings, and sitemap links
- Sends to AI with structured function calling to return scores + action plan
- Saves result to `optimization_jobs` table
- Updates `content_items` with the overall score (new `seo_score` column)

**3. Content Detail: "Optimization" tab**

- Add a new tab in the Content Detail view alongside Editor, Preview, Performance, Fulfilment
- Shows the latest optimization score as a gauge/ring chart
- Displays score breakdown (5 dimensions) as progress bars
- Lists the action plan as a checklist with effort/impact badges
- "Run Optimization Scan" button to trigger a new analysis

**4. New `seo_score` column on `content_items`**

- Integer column (nullable) to store the latest overall score
- Displayed as a small badge in the Content Pipeline list view for quick scanning

**5. Content Pipeline: score badges**

- Show a small colored score badge (green/amber/red) next to each content item in the pipeline list
- Makes it easy to spot which content needs attention

### No Changes To

- Sidebar navigation (no new section -- optimization lives inside the content detail view)
- Existing agent pipeline
- Brand management

### Technical Details

**Score Dimensions (weighted):**
```text
Technical SEO (25%) -- meta title length, meta description, schema types, slug
On-Page SEO (25%) -- keyword in title, keyword density, heading structure  
Readability (20%) -- sentence length, paragraph breaks, plain language
Internal Linking (15%) -- number of internal links, link relevance
Content Depth (15%) -- word count vs competitors, topic coverage
```

**Action Plan Structure:**
```json
[
  {
    "action": "Add FAQ schema markup",
    "dimension": "technical",
    "effort": "low",
    "impact": "high",
    "priority": 1
  }
]
```

**AI Prompt Pattern:**
The edge function uses structured function calling (same pattern as `seo-optimize`) to ensure consistent JSON output with scores and actions.

**Database Migration:**
1. Create `optimization_jobs` table with RLS
2. Add `seo_score` integer column to `content_items`

**New/Modified Files:**
- `supabase/functions/optimization-score/index.ts` (new)
- `src/components/OptimizationTab.tsx` (new -- score display + action plan)
- `src/components/ContentDetail.tsx` (add Optimization tab)
- `src/components/ContentPipeline.tsx` (show score badges)
- Database migration for new table + column

