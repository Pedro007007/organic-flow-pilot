

## Add Backlink to "PJ Media Magnet Ltd" in CTA

### What
Turn "PJ Media Magnet Ltd" into a clickable link pointing to `https://searcheraa.com/` in the mandatory CTA paragraph across both edge functions.

### Changes

#### 1. `supabase/functions/upgrade-internal-links/index.ts`
- Update the `CTA_PARAGRAPH` constant (line 11): Change `Contact PJ Media Magnet Ltd today` → `Contact [PJ Media Magnet Ltd](https://searcheraa.com/) today`
- Update the check on line 162 to still detect the CTA (search for `"PJ Media Magnet Ltd"` instead of the full phrase)

#### 2. `supabase/functions/content-generate/index.ts`
- Update the CTA string (line 297): Same change — wrap "PJ Media Magnet Ltd" in a markdown link to `https://searcheraa.com/`
- Update the detection check on line 298 similarly

Both functions get the same updated CTA text. Existing articles won't change, but any newly generated or link-upgraded articles will include the backlink.

