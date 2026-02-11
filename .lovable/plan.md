

# SERP-Informed Content Writer with Image Generation

## Overview

Build a complete SERP-research-to-publish pipeline that scrapes competitor content from Google, analyses it with Gemini, generates strategically superior articles, and creates matching hero images using Nano Banana -- all automated.

## Prerequisites

**Firecrawl Connector** -- must be connected before building. Firecrawl's Search API will power the SERP research step, searching Google and scraping the top results in one call.

## Architecture

The enhanced pipeline adds two new backend functions and upgrades the existing content generation:

```text
+-------------------+     +------------------+     +---------------------+
| 1. Keyword        | --> | 2. SERP Research | --> | 3. Content Strategy |
|    Discovery      |     |    (NEW)         |     |    (Enhanced)       |
+-------------------+     +------------------+     +---------------------+
                                                            |
                          +------------------+     +--------v------------+
                          | 5. Image Gen     | <-- | 4. Content Generate |
                          |    (NEW)         |     |    (Enhanced)       |
                          +------------------+     +---------------------+
                                                            |
                          +------------------+     +--------v------------+
                          | 7. Monitor &     | <-- | 6. SEO Optimize +   |
                          |    Refresh       |     |    Publish          |
                          +------------------+     +---------------------+
```

## Implementation Steps

### Step 1: Connect Firecrawl

Prompt you to connect the Firecrawl connector so `FIRECRAWL_API_KEY` is available in edge functions.

### Step 2: New Edge Function -- `serp-research`

**File:** `supabase/functions/serp-research/index.ts`

- Accepts `{ keyword, limit? }` from the frontend
- Calls Firecrawl Search API (`POST https://api.firecrawl.dev/v1/search`) with the keyword
- Scrapes the top 10 results with `scrapeOptions: { formats: ['markdown'] }`
- Extracts from each result: title, URL, headings structure, word count, key topics
- Sends all extracted data to Gemini (`google/gemini-3-flash-preview`) for competitive analysis
- Returns a structured competitor brief: common headings, content gaps, average word count, FAQ patterns, unique angles to exploit
- Logs to `agent_runs` table

### Step 3: Enhance `content-strategy`

- Accept an optional `serpResearch` object (the output from step 2)
- Update the Gemini prompt to incorporate competitor data: "Here are the top 10 ranking pages for this keyword..." so the strategy is built to outrank them specifically
- Include competitor gap analysis in the returned strategy

### Step 4: Enhance `content-generate`

- Accept an optional `serpResearch` and `strategy` object
- Update the system prompt to reference competitor weaknesses and content gaps
- Add instruction: "Your article must cover everything competitors cover PLUS these gaps: [gaps from research]"
- This ensures content is strategically superior, not written blind

### Step 5: New Edge Function -- `generate-hero-image`

**File:** `supabase/functions/generate-hero-image/index.ts`

- Accepts `{ keyword, title, contentItemId }`
- Calls Lovable AI Gateway with model `google/gemini-2.5-flash-image` (Nano Banana)
- Prompt: generates a professional, blog-appropriate hero image based on the article title and keyword
- Receives base64 image data
- Uploads the image to Supabase Storage (new `content-images` bucket)
- Saves the public URL back to the `content_items` table (new `hero_image_url` column)
- Logs to `agent_runs` table

### Step 6: Database Migration

- Add `hero_image_url` (text, nullable) column to `content_items`
- Add `serp_research` (jsonb, nullable) column to `content_items` to cache competitor data
- Create a `content-images` storage bucket (public)
- Add storage policy for authenticated users to upload

### Step 7: Update Agent Pipeline UI

- Add "SERP Research" and "Image Generation" to the `agentFunctionMap` in `AgentPipeline.tsx`
- Update `mockAgents` in `mockData.ts` to include the two new agents
- Update `AgentStatus` type if needed

### Step 8: Update Autopilot Flow

Enhance `ContentPipeline.tsx` autopilot to run the full enhanced pipeline:

1. SERP Research (new)
2. Content Strategy (with SERP data)
3. Content Generate (with SERP data + strategy)
4. Generate Hero Image (new)
5. SEO Optimize
6. Publish

### Step 9: Display Hero Image

Update `ContentDetail.tsx` to show the generated hero image above the content draft area, with a "Regenerate Image" button.

### Step 10: Update `config.toml`

Add entries for the two new functions:
- `serp-research` with `verify_jwt = false`
- `generate-hero-image` with `verify_jwt = false`

## Technical Details

**Firecrawl Search API call:**
```text
POST https://api.firecrawl.dev/v1/search
Body: { query: keyword, limit: 10, scrapeOptions: { formats: ["markdown"] } }
```

**Nano Banana image generation call:**
```text
POST https://ai.gateway.lovable.dev/v1/chat/completions
Body: {
  model: "google/gemini-2.5-flash-image",
  messages: [{ role: "user", content: "Generate a hero image for: [title]" }],
  modalities: ["image", "text"]
}
```

The base64 image from `choices[0].message.images[0].image_url.url` gets uploaded to storage, not passed back to the client directly.

**Rate limit / error handling:** All new functions will catch 429 and 402 errors from both Firecrawl and the AI gateway, returning meaningful error messages to the frontend via toast notifications.

