

## Fix CTA Always Using Correct Backlink

### Problem
The AI model is rewriting the CTA in its own words with wrong URLs (e.g., `pjcmediamagnet.com`, `surrey-energy-canvas.lovable.app`) instead of using the exact hardcoded CTA. The post-generation check `includes("PJ Media Magnet Ltd")` returns `true` because the AI included the brand name, so the correct CTA never gets appended.

### Solution

#### 1. `supabase/functions/content-generate/index.ts`
- **Remove** the CTA instruction from the AI system prompt entirely — don't ask the AI to write a closing CTA
- **After** receiving AI output, strip any AI-generated CTA-like paragraph at the end (anything mentioning "PJ Media Magnet" or "contact us" in the last paragraph)
- **Always** append the exact hardcoded CTA paragraph with the correct `https://searcheraa.com/` link, unconditionally (remove the `includes` check)

#### 2. `supabase/functions/upgrade-internal-links/index.ts`
- Add a rule to the AI system prompt: "Do NOT modify or rewrite the final CTA paragraph"
- After AI returns content, strip any malformed CTA and re-append the exact hardcoded version
- Replace the `includes("PJ Media Magnet Ltd")` check with unconditional append after stripping

#### 3. `src/components/ContentPreview.tsx` and `src/pages/BlogPost.tsx`
- Add a custom `components` prop to `ReactMarkdown` so that external links (`https://...`) open in a new tab with `target="_blank" rel="noopener noreferrer"`
- This ensures the searcheraa.com link actually navigates correctly instead of being handled by React Router

### Why this fixes it
- The AI can no longer invent its own CTA with wrong URLs
- The exact CTA with the correct backlink is always the last thing in every article
- External links open properly in a new tab

