

## Elaborate SEO Report Generator with Email-Gated Sharing and Live Preview

### Overview

This plan transforms the current basic scan results into a full Scansuite-style report system with three major additions:

1. **Report Settings Panel** -- A configuration page with Content, Colors, and Call to Action tabs where you customize how your reports look (headline text, colors, CTA buttons, legal links, disclaimers -- exactly like the screenshots)
2. **Shareable Public Report with Email Gate** -- When you share a report link with prospects, they must enter their email address before they can view the report. This captures leads automatically.
3. **Live SEO Preview** -- A real-time preview panel (Scan Website / SEO Analysis / SEO Report tabs) showing exactly how the report will appear to prospects

---

### What You Will See

**Report Settings Page (new sidebar entry: "Reports")**
- Left side: Settings panel with 3 tabs
  - **Content tab**: Toggle SEO status on/off, set headline text + size (Small/Medium/Large), subheadline text, toggle blurb boxes visibility, legal links, disclaimer
  - **Colors tab**: Primary color, background, accent colors for the report
  - **Call to Action tab**: Configure multiple CTA blocks (Competitor Analysis, Content Strategy Insights, Traffic and Performance, Seasonal SEO Trends) each with button text, redirect link, CTA title, CTA description, and enable/disable toggle
- Right side: Live preview showing how the report looks with your settings applied in real-time
- Preview has 3 sub-tabs: "Scan Website", "SEO Analysis", "SEO Report"
- "Live Preview" button to open the report in a new window
- "Save Changes" button at the bottom

**Public Report Page (new route: `/report/:reportId`)**
- Before viewing: Email capture form with your branding, headline, and a field asking for their email
- After entering email: Full SEO report is revealed with all sections (scores, content gap analysis, keywords, meta patterns, CTAs)
- The captured email is saved to a new `report_leads` database table

**Enhanced Report Content**
- The report itself becomes much richer: overall SEO score with circular gauge, detailed section breakdowns, comparison charts, actionable recommendations, and the configurable CTA blocks from settings

---

### Technical Details

**New database tables:**
- `report_settings` -- stores per-user report configuration (headline, colors, CTAs, toggles)
  - Columns: id, user_id, headline_text, headline_size, subheadline_text, show_headline, show_subheadline, hide_blurbs, show_legal_links, show_disclaimer, disclaimer_text, colors (jsonb), cta_blocks (jsonb), created_at, updated_at
- `report_leads` -- stores emails captured from prospects viewing shared reports
  - Columns: id, user_id, scan_id (FK to competitor_scans), email, viewed_at, created_at

**New components:**
- `src/components/ReportSettings.tsx` -- The full settings panel with Content/Colors/CTA tabs and live preview
- `src/components/ReportPreview.tsx` -- The live preview component used both in settings and on the public page
- `src/pages/PublicReport.tsx` -- Public route with email gate, then renders the report

**New route:**
- `/report/:reportId` -- public (no auth required), shows email gate then report

**Updated files:**
- `src/components/SidebarNav.tsx` -- Add "Reports" nav entry
- `src/pages/Index.tsx` -- Add reports section routing
- `src/App.tsx` -- Add `/report/:reportId` public route
- `src/components/BusinessScanner.tsx` -- Add "Share Report" and "Generate Report" buttons that link to the report system

**RLS policies:**
- `report_settings`: Users can only read/write their own settings
- `report_leads`: Users can only read leads for their own reports; public inserts allowed (for the email capture from anonymous prospects)

**Edge function:**
- No new edge function needed -- the public report page reads the scan data directly via a public-facing query (the scan ID is the access token, and we only expose the report data, not user internals)

**How the share flow works:**
1. User runs a scan in Business Scanner
2. User clicks "Share Report" on a scan result
3. A shareable link is generated: `https://your-app.com/report/{scan-id}`
4. User sends this link to a prospect
5. Prospect opens the link, sees your branded report page
6. Prospect enters their email to unlock the full report
7. Email is saved to `report_leads`, prospect sees the full SEO analysis
8. User can view all captured leads in the Reports section

