

## Multi-Channel Content Repurposing

Transform existing long-form content into platform-specific formats: LinkedIn posts, YouTube descriptions, and Twitter/X threads -- all brand-aware and generated via AI.

### What Gets Built

**1. Database: `repurposed_content` table**

Stores each repurposed output:
- `id` (uuid), `user_id`, `content_item_id` (FK to content_items)
- `channel` (text: "linkedin", "youtube", "twitter")
- `output` (text -- the generated content)
- `status` (text: "generating", "completed", "error")
- `created_at`
- RLS: users can only see their own repurposed content

**2. Edge function: `supabase/functions/content-repurpose/index.ts`**

- Accepts `contentItemId` and `channel` (linkedin | youtube | twitter)
- Authenticates the user, fetches the content item's `draft_content`, `title`, `keyword`, and brand settings
- Sends to Lovable AI with a channel-specific system prompt:
  - **LinkedIn**: Professional post (1300 chars max), hook-first, CTA at end, relevant hashtags
  - **YouTube**: Title, description (5000 chars), timestamps placeholder, tags
  - **Twitter/X**: Thread format (numbered tweets, 280 chars each), hook tweet first
- Saves result to `repurposed_content` table
- Returns the generated output

**3. New UI tab: "Repurpose" in ContentDetail**

- Add a new tab alongside Content & Metadata, Optimization, and SEO/GEO Fulfilment
- Shows three channel cards (LinkedIn, YouTube, Twitter) with generate buttons
- Displays previously generated outputs per channel with copy-to-clipboard
- "Regenerate" button for each channel

**4. New component: `src/components/RepurposeTab.tsx`**

- Fetches existing repurposed content for the current content item
- Channel cards with icons, generate/regenerate buttons
- Output display with copy button
- Loading states during generation

### Files Changed

| File | Action |
|------|--------|
| Database migration | Create `repurposed_content` table with RLS |
| `supabase/functions/content-repurpose/index.ts` | New edge function |
| `supabase/config.toml` | Add function config (auto-managed) |
| `src/components/RepurposeTab.tsx` | New UI component |
| `src/components/ContentDetail.tsx` | Add "Repurpose" tab |

### No Changes To

- Content Pipeline list view
- Sidebar navigation
- Existing agent pipeline or optimization jobs

### Technical Details

**Channel Prompts:**

LinkedIn: "Convert this article into a compelling LinkedIn post. Start with a strong hook line. Keep under 1300 characters. End with a call-to-action. Add 3-5 relevant hashtags. No markdown formatting."

YouTube: "Create a YouTube video description from this article. Include: an engaging title suggestion, a detailed description (under 5000 chars), 5 timestamp placeholders, and 10 relevant tags as a comma-separated list."

Twitter/X: "Convert this article into a Twitter thread. Format as numbered tweets (1/, 2/, etc). Each tweet must be under 280 characters. Start with a compelling hook. End with a CTA tweet. Aim for 5-8 tweets."

**Brand Integration:**
Same pattern as content-rewrite -- fetches brand tone, style, and cliche rules, injects into system prompt.

**AI Model:** google/gemini-3-flash-preview (default, fast and cost-effective for reformatting tasks).

