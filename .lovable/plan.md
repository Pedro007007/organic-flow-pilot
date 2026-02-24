
Goal
- Make every live blog article open correctly from the Blog page, including items that were published and later moved to Monitoring.

What I verified
- The blog list page currently fetches only rows where `status = "published"` (`src/pages/Blog.tsx`).
- The blog detail page also fetches only rows where `status = "published"` (`src/pages/BlogPost.tsx`).
- In the database, at least one article URL the app generated (`/blog/local-seo-guide-smb-growth`) now has `status = "monitoring"`, so detail lookup returns no row and shows “Article Not Found”.
- This explains why some “published” links stop working after stage progression.

Implementation plan

1) Align “publicly visible blog” statuses
- Define a single live-status rule for blog visibility: `["published", "monitoring"]`.
- Use this same rule in both pages so list and detail never disagree.

2) Update blog listing query (`src/pages/Blog.tsx`)
- Replace:
  - `.eq("status", "published")`
- With:
  - `.in("status", ["published", "monitoring"])`
- Keep current sort (`updated_at desc`) and existing UI layout.
- Add a safe filter for valid links:
  - ignore rows with missing/empty slug to prevent dead cards.

3) Update blog detail query (`src/pages/BlogPost.tsx`)
- Replace:
  - `.eq("status", "published")`
- With:
  - `.in("status", ["published", "monitoring"])`
- Keep slug filter as-is.
- This makes old shared URLs continue to resolve even after a post moves to Monitoring.

4) Add explicit error state handling (small UX hardening)
- Both pages currently throw query errors but mostly fall back to empty/not-found messaging.
- Add a lightweight “Couldn’t load articles”/“Couldn’t load article” state when `error` exists to distinguish:
  - real not-found
  - fetch or permission issue
- This prevents confusion during debugging and support.

5) Validation checklist
- Open `/blog` and confirm cards include both `published` and `monitoring` posts.
- Click a known monitoring slug (e.g. `local-seo-guide-smb-growth`) and verify article renders instead of “Article Not Found”.
- Confirm existing published posts still render.
- Confirm export button still works on blog detail.
- Confirm empty state still appears only when no live posts exist.

Technical notes
- No database schema or policy changes are required for this fix.
- No dependency changes are required.
- Files to update:
  - `src/pages/Blog.tsx`
  - `src/pages/BlogPost.tsx`

Acceptance criteria
- A post that has been published and then moved to Monitoring is still accessible at `/blog/:slug`.
- Blog list and blog detail use consistent visibility rules.
- Users no longer hit false “Article Not Found” for live content.
