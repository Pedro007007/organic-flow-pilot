

## Add AI Internal Link Upgrade + Mandatory CTA Footer

### What
1. Add an "Upgrade Internal Links" button in the content draft editor that uses AI to scan the current article and inject up to 7-8 internal links from existing sitemap pages and content items.
2. Automatically append a fixed CTA paragraph at the end of every generated/upgraded article for brand consistency.

### Changes

#### 1. New edge function: `supabase/functions/upgrade-internal-links/index.ts`
- Accepts `contentItemId` and `draftContent`
- Authenticates the user, loads the content item's brand
- Fetches all internal link candidates (sitemap pages + content items with slugs), up to 24 candidates
- Sends the current article + link candidates to the AI with instructions to:
  - Insert up to 7-8 contextually relevant internal links using natural anchor text
  - Spread links across different sections
  - Preserve all existing content, formatting, and images
  - Do NOT duplicate links already present
- Returns the upgraded content

#### 2. Update `supabase/functions/content-generate/index.ts`
- Increase `maxLinks` default from 5 to 8
- After image placeholder replacement, append the mandatory CTA paragraph:
  ```
  ---

  *If you are a business owner in the renewable sector or a local Surrey installer looking to reach more customers, let's talk about how to grow your reach. Contact PJ Media Magnet Ltd today to discover how our expert SEO and content strategies can put your business at the forefront of the green energy revolution.*
  ```
- Add the same CTA to the system prompt as a required closing paragraph

#### 3. Update `src/components/ContentDetail.tsx`
- Add `Link` icon import from lucide-react
- Add `upgradingLinks` state
- Add `handleUpgradeLinks` function that calls `upgrade-internal-links` edge function with the current draft content and content item ID, then updates `draftContent` with the result
- Add "Upgrade Links" button in the writing stage action bar (next to Optimize SEO), styled with a link icon
- The upgraded content auto-appends the CTA if not already present

#### 4. Update `supabase/functions/upgrade-internal-links/index.ts` — CTA enforcement
- After AI returns upgraded content, check if the CTA paragraph is present; if not, append it
- This ensures the CTA is always the last thing in every article regardless of how it was generated or edited

### Technical detail
- The upgrade function reuses the same link candidate logic from `content-generate` (sitemap pages + content items)
- The CTA text is hardcoded as a constant in both functions for consistency
- No database changes needed — the function reads existing tables and updates `draft_content`

