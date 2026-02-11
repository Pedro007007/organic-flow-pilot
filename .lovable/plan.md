
## Improve Text Visibility Across Dark and Light Modes

### Problem
Several text elements across the report components and dashboard use `text-muted-foreground` at very small font sizes (9px-12px), making them difficult to read in both dark and light modes. The muted foreground color has insufficient contrast -- especially for body-level content, table details, and scorecard labels.

### Solution
Two-pronged approach:

1. **Increase the contrast of `text-muted-foreground`** in both themes by adjusting the CSS variables in `src/index.css`:
   - Dark mode: change from `215 15% 55%` to `215 15% 65%` (brighter)
   - Light mode: change from `220 10% 45%` to `220 10% 35%` (darker)

2. **Upgrade key text elements** from `text-muted-foreground` to `text-foreground` or `text-foreground/80` where the content is important (not just decorative labels), across these files:
   - `ExecutiveSummary.tsx` -- summary paragraph text, scorecard sub-labels
   - `TechnicalAudit.tsx` -- detail text under each audit element
   - `KeywordOpportunities.tsx` -- CPC sub-text
   - `CompetitorGap.tsx` -- lost traffic description, "You"/"Competitor" labels
   - `ContentAuthority.tsx` -- content freshness labels
   - `BacklinkProfile.tsx` -- top referring domain names
   - `ActionPlan.tsx` -- individual action item text (currently `text-muted-foreground`, should be `text-foreground/80`)
   - `RevenueProjection.tsx` -- calculation row labels
   - `LocalSeo.tsx` -- stat labels
   - `ReportPreview.tsx` -- tab labels
   - `MetricCard.tsx` -- change label text

### Files to Change

| File | Change |
|------|--------|
| `src/index.css` | Adjust `--muted-foreground` HSL values for both dark and light themes |
| `src/components/report/ExecutiveSummary.tsx` | Upgrade summary paragraph to `text-foreground/80` |
| `src/components/report/TechnicalAudit.tsx` | Upgrade detail text to `text-foreground/70` |
| `src/components/report/KeywordOpportunities.tsx` | Upgrade CPC text |
| `src/components/report/CompetitorGap.tsx` | Upgrade comparison labels and lost traffic text |
| `src/components/report/BacklinkProfile.tsx` | Upgrade referring domain text from muted to `text-foreground/70` |
| `src/components/report/ActionPlan.tsx` | Upgrade action item text to `text-foreground/80` |
| `src/components/report/RevenueProjection.tsx` | Upgrade calculation labels |
| `src/components/report/LocalSeo.tsx` | Upgrade stat labels |
| `src/components/MetricCard.tsx` | Upgrade change label |

### Technical Details

**CSS variable changes in `src/index.css`:**

Dark mode (`:root`):
- `--muted-foreground: 215 15% 55%` becomes `--muted-foreground: 215 15% 65%`

Light mode (`.light`):
- `--muted-foreground: 220 10% 45%` becomes `--muted-foreground: 220 10% 35%`

**Component text upgrades:**
- Body/description text: `text-muted-foreground` to `text-foreground/80`
- Detail/sub-label text: `text-muted-foreground` to `text-foreground/70`
- Purely decorative/helper labels (e.g., "30%", "/100"): keep as `text-muted-foreground` (now more visible with the CSS change)

This combined approach ensures that even elements we don't individually update benefit from the improved base contrast, while critical content gets an additional visibility boost.
