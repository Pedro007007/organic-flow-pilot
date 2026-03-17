

## Enhance Text Visibility on SEO Checklist

The screenshot shows the hero section text is hard to read against the dark background. The title uses `text-xl` and the description uses `text-sm text-muted-foreground`, which is too small and low-contrast.

### Changes in `src/components/SeoChecklist.tsx`

**Hero section (lines 147-158):**
- Title: bump from `text-xl` to `text-2xl` and add `text-white` for stronger contrast
- Description: bump from `text-sm text-muted-foreground` to `text-base text-gray-300` for better readability
- Icon: increase from `h-6 w-6` to `h-7 w-7`

**Overall Score section (line 165):**
- Ensure labels use `text-foreground` or `text-white` for visibility

These are small class changes — no structural or logic modifications needed.

