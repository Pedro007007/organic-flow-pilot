

## Unified SEO + AEO System with LLM Search Intelligence

This plan integrates the GPT LLM SEO Chrome extension concept directly into the Searchera platform as a native feature, adds AEO scoring/optimization, and enriches the Next.js/Vercel publishing pipeline with structured data -- all in one unified system.

### What Gets Built

**Phase 1: LLM Search Intelligence (built-in replacement for Chrome extension)**

Instead of a separate Chrome extension, we build a native "LLM Search Lab" inside Searchera that:
- Lets users enter a topic/prompt, sends it to an AI model, and captures the `search_model_queries` the AI generates
- Displays the extracted queries in real-time with auto-refresh
- Cross-references each query against existing keyword data (volume, intent, position) from the `keywords` table
- Highlights keyword gaps (queries the AI searches for that your content doesn't cover)
- One-click "Add to Keywords" to feed discoveries into the content pipeline

**New sidebar section**: "LLM Search" (between Rankings and Calendar)

**New database table**: `llm_search_sessions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| prompt | text | The user's original topic/question |
| queries | jsonb | Array of extracted search queries |
| keyword_matches | jsonb | Cross-referenced matches from keywords table |
| created_at | timestamptz | When the session ran |

RLS: users see only their own sessions.

**New edge function**: `llm-search`
- Accepts a user prompt
- Sends it to the AI gateway with a system prompt instructing the model to act as a research assistant that would search the web -- returning the exact search queries it would use
- Uses tool calling to return structured output: array of `{ query, intent, estimated_volume_tier, reasoning }`
- Cross-references returned queries against the user's `keywords` table
- Saves session to `llm_search_sessions`

**New component**: `src/components/LlmSearchLab.tsx`
- Search input for entering topics
- Results panel showing extracted queries with intent tags
- "Match" column showing if the query exists in user's keyword list
- "Gap" badge for queries not currently targeted
- "Add to Keywords" button per query
- Session history list

---

**Phase 2: AEO Scoring and Optimization**

Add an AEO dimension to the existing optimization system.

**New database table**: `aeo_scores`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| content_item_id | uuid | FK to content_items |
| user_id | uuid | Owner |
| overall_score | integer | 0-100 AEO score |
| scores | jsonb | Breakdown: faq_coverage, answer_blocks, entity_clarity, schema_richness, conciseness |
| recommendations | jsonb | Array of actionable AEO improvements |
| created_at | timestamptz | When scored |

RLS: users see only their own scores.

**New edge function**: `aeo-score`
- Accepts a content item ID
- Fetches the draft content, analyzes it for AEO readiness:
  - FAQ coverage (does the content answer common questions?)
  - Answer block quality (TL;DR, key takeaways present?)
  - Entity clarity (are entities well-defined for AI extraction?)
  - Schema richness (FAQPage, HowTo, QAPage schemas present?)
  - Conciseness (are answers snippet-friendly, under 50 words per answer?)
- Returns overall score + breakdown + recommendations

**UI changes**: Add "AEO" tab in ContentDetail alongside Optimization
- Shows AEO score gauge
- Breakdown cards for each dimension
- Recommendations list with "Fix" suggestions
- "Generate Answer Blocks" button that auto-creates TL;DR and Key Takeaways

**New edge function**: `generate-answer-blocks`
- Takes content and generates: TL;DR (2 sentences), Key Takeaways (5 bullets), FAQ pairs (Q+A format)
- Appends these to the draft content

---

**Phase 3: Enhanced Next.js/Vercel Publishing Pipeline**

Enrich the existing `publish-webhook` payload with SEO+AEO structured data.

**Changes to `publish-webhook` edge function**:
- Include JSON-LD structured data in the payload (Article, FAQPage, HowTo schemas)
- Include Open Graph metadata (og:title, og:description, og:image)
- Include generated answer blocks (TL;DR, Key Takeaways, FAQs)
- Include AEO score alongside SEO score
- Add `x-aeo-score` header for Next.js to use in prioritization

**Changes to `NextJsSetupGuide.tsx`**:
- Update code snippets to show how to render JSON-LD from webhook payload
- Add OG meta tag rendering example
- Add FAQ schema rendering example
- Add answer block rendering example

**New column on `content_items`**: `structured_data` (jsonb)
- Stores generated JSON-LD, OG tags, and answer blocks
- Populated by a new edge function or during SEO optimization

---

### Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | `llm_search_sessions` + `aeo_scores` tables, add `structured_data` column to `content_items` |
| `supabase/functions/llm-search/index.ts` | Create | LLM search query extraction + keyword cross-referencing |
| `supabase/functions/aeo-score/index.ts` | Create | AEO scoring engine |
| `supabase/functions/generate-answer-blocks/index.ts` | Create | TL;DR, Takeaways, FAQ generator |
| `supabase/functions/publish-webhook/index.ts` | Modify | Add structured data, OG tags, answer blocks to payload |
| `src/components/LlmSearchLab.tsx` | Create | Full LLM Search Lab UI |
| `src/components/AeoTab.tsx` | Create | AEO scoring + recommendations UI in ContentDetail |
| `src/components/ContentDetail.tsx` | Modify | Add "AEO" tab |
| `src/components/SidebarNav.tsx` | Modify | Add "LLM Search" nav item |
| `src/pages/Index.tsx` | Modify | Add LLM Search section routing |
| `src/components/NextJsSetupGuide.tsx` | Modify | Updated snippets with JSON-LD, OG, FAQ rendering |

### No Changes To

- Existing SEO optimization pipeline
- Content generation or strategy agents
- Brand management
- Report system
- Rankings tracker

### Technical Details

**LLM Search - AI Prompt Strategy:**
The system prompt instructs the model to behave as a search research assistant: "Given a topic, list the exact search queries you would use to research this comprehensively. Include informational, commercial, and long-tail variants. Return structured data."

Tool calling extracts: `{ queries: [{ query, intent, volume_tier: "high"|"medium"|"low", reasoning }] }`

**AEO Scoring Dimensions (weighted):**
- FAQ Coverage (25%): Does content answer questions in Q+A format?
- Answer Blocks (20%): Are there TL;DR, key takeaways, summaries?
- Entity Clarity (20%): Are key entities explicitly defined?
- Schema Richness (20%): FAQPage, HowTo, QAPage schemas present?
- Conciseness (15%): Are answers under 50 words, extractable by AI?

**Keyword Cross-Reference Logic:**
When LLM search returns queries, each query is fuzzy-matched against the user's `keywords` table using case-insensitive partial matching. Results are tagged as "Matched" (already targeting), "Partial" (related keyword exists), or "Gap" (not targeted at all).

**Structured Data in Webhook Payload:**
```json
{
  "action": "publish",
  "content": { ... },
  "structured_data": {
    "json_ld": { "@type": "Article", ... },
    "faq_schema": { "@type": "FAQPage", ... },
    "og_tags": { "og:title": "...", "og:description": "...", "og:image": "..." },
    "answer_blocks": {
      "tldr": "...",
      "key_takeaways": ["...", "..."],
      "faqs": [{ "question": "...", "answer": "..." }]
    }
  },
  "scores": { "seo": 72, "aeo": 85 }
}
```

