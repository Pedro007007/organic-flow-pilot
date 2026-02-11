

## New Searchera Features: AI Rankings, GEO Tracking, Business Scanner, and SEO Checklist

This plan adds four powerful new modules to Searchera's dashboard, each with its own sidebar navigation entry, UI components, database tables, and backend functions.

---

### Feature 1: AI SEO and Organic Rankings Tracker

Track how your pages rank in both traditional Google search AND AI answer engines (like Google AI Overviews, ChatGPT, Perplexity).

**What you'll see:**
- A "Rankings" page showing a table of your tracked URLs with their Google position, whether they appear in AI overviews, and trend changes over time
- A line chart showing position movement over days/weeks
- Badges indicating if a page is cited in AI answers (GEO visibility)

**What gets built:**
- New `rankings` database table storing daily position snapshots per URL/keyword
- New `ai_citations` table tracking AI engine mentions
- New edge function `rankings-check` that uses AI to analyze current ranking data from GSC and estimate AI visibility
- New `RankingsTracker` component with table + chart views
- New sidebar nav entry: "Rankings"

---

### Feature 2: SEO/GEO Fulfilment and Tracking

Track which SEO and GEO (Generative Engine Optimization) tasks have been completed for each content piece -- meta tags, schema markup, internal links, AI-friendly formatting, FAQ sections, etc.

**What you'll see:**
- Per content item, a fulfilment scorecard showing completion percentage
- Checklist items like: "Meta title set", "Schema added", "FAQ section present", "Direct answer paragraph", "Internal links added"
- A summary dashboard showing overall fulfilment across all content

**What gets built:**
- New `seo_fulfilment` database table linking content items to checklist criteria with pass/fail status
- New edge function `fulfilment-scan` that analyzes each content item against SEO/GEO criteria using AI
- New `FulfilmentDashboard` component with progress bars and per-item detail view
- Integrated into the existing Content Detail page as a new tab

---

### Feature 3: Business Scanner (Competitor Analysis)

Enter a competitor's domain and get an AI-powered breakdown of their SEO strategy -- what keywords they target, content structure, schema usage, and estimated traffic.

**What you'll see:**
- An input field to enter a competitor URL
- A results card showing: estimated top keywords, content types, schema usage, meta tag patterns, and a competitive gap analysis vs your site
- History of past scans saved for comparison

**What gets built:**
- New `competitor_scans` database table storing scan results per domain
- New edge function `business-scanner` that uses Firecrawl (web scraper connector) to crawl the competitor page and AI to analyze the SEO strategy
- New `BusinessScanner` component with domain input, scan results, and scan history
- New sidebar nav entry: "Scanner"
- Requires connecting the **Firecrawl** connector for web scraping

---

### Feature 4: SEO Checklist

A reusable, interactive checklist covering all essential SEO tasks for any content piece or site-wide audit. Items can be checked off manually or auto-verified by the system.

**What you'll see:**
- A categorized checklist: On-Page SEO, Technical SEO, Content Quality, GEO Readiness, Link Building
- Each item shows status (done/pending/not applicable), with tips on hover
- Progress bar per category and overall completion score
- Option to run auto-check which uses AI to verify items against your actual content

**What gets built:**
- New `seo_checklists` database table with template items and per-content completion status
- New `SeoChecklist` component with collapsible category sections, progress tracking, and auto-check button
- New edge function `checklist-verify` that reads content and auto-marks items as complete
- New sidebar nav entry: "Checklist"

---

### Navigation Updates

The sidebar will be extended with 3 new entries (Fulfilment is embedded in Content Detail):

| Current | New Additions |
|---------|--------------|
| Dashboard | Rankings |
| Keywords | Scanner |
| Content | Checklist |
| Calendar | |
| Agents | |
| Analytics | |
| Team | |
| Settings | |

---

### Implementation Order

Given the dependencies, the recommended build order is:

1. **SEO Checklist** -- standalone, no external dependencies, immediately useful
2. **AI SEO and Organic Rankings** -- builds on existing GSC data
3. **SEO/GEO Fulfilment Tracking** -- extends content items, uses checklist concepts
4. **Business Scanner** -- requires Firecrawl connector setup

---

### Technical Details

**Database migrations needed:**
- `rankings` table: id, user_id, keyword, url, position, previous_position, ai_cited (boolean), ai_engine (text), snapshot_date, created_at
- `ai_citations` table: id, user_id, url, engine (google_ai, chatgpt, perplexity), cited (boolean), snippet, checked_at
- `seo_fulfilment` table: id, user_id, content_item_id (FK), criterion, category, passed (boolean), details, checked_at
- `competitor_scans` table: id, user_id, domain, scan_results (jsonb), keywords_found (jsonb), schema_types (text[]), meta_patterns (jsonb), created_at
- `seo_checklists` table: id, user_id, content_item_id (nullable FK), category, item_label, description, status (pending/done/na), auto_verified (boolean), verified_at, created_at

**New edge functions:**
- `rankings-check` -- analyzes GSC data + AI to estimate rankings and AI citations
- `fulfilment-scan` -- runs SEO/GEO criteria checks against content
- `business-scanner` -- scrapes competitor domain (via Firecrawl) and analyzes with AI
- `checklist-verify` -- auto-checks SEO checklist items against content

**New frontend components:**
- `src/components/RankingsTracker.tsx`
- `src/components/FulfilmentDashboard.tsx`
- `src/components/BusinessScanner.tsx`
- `src/components/SeoChecklist.tsx`

**External dependency:**
- Firecrawl connector needed for Business Scanner (web scraping). You'll be prompted to connect it when we build that feature.

All AI operations use the Lovable AI gateway (no external API keys needed except Firecrawl for the scanner).

