
## Brand-Aware Content Rewrite

Make the `content-rewrite` edge function respect brand identity (tone, style, cliche rules) so that rewrites, expansions, and shortenings match the selected brand's voice.

### What Changes

**1. Edge function: `supabase/functions/content-rewrite/index.ts`**

- Accept an optional `brandId` parameter in the request body
- Add Supabase client initialization (same pattern as `content-generate`)
- Authenticate the user via the Authorization header
- If `brandId` is provided, fetch the brand's `tone_of_voice`, `writing_style`, and `writing_preferences.avoid_cliches` from the `brands` table
- If no `brandId`, fall back to the user's default brand
- Inject brand settings into each system prompt (rewrite/expand/shorten) so the AI follows the brand voice
- Example: "Write in a [confident, witty] tone. Use [conversational] style. Never use: [list of cliches]."

**2. Frontend: `src/components/ContentDetail.tsx`**

- Pass the content item's `brand_id` to the `content-rewrite` invocation so the function knows which brand to load
- Update the `handleRewrite` call: `body: { text: draftContent, action, brandId: item.brand_id }`

### No Database Changes

The `brands` table already has all the required fields (`tone_of_voice`, `writing_style`, `writing_preferences`). No schema updates needed.

### Technical Details

The enhanced system prompt will look like:

```text
You are a professional content editor.
Brand voice rules:
- Tone: {brand.tone_of_voice}
- Style: {brand.writing_style}
- NEVER use these phrases: {avoid_cliches list}
Rewrite the following text to be clearer...
```

If no brand is found, the function falls back to the current generic prompts -- fully backward-compatible.
