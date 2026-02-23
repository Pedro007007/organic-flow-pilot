
-- =====================================================
-- FIX 1: Profiles - Restrict public read to own profile
-- =====================================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- FIX 2: Report Settings - Scope public read to users
-- who have at least one public scan (needed by PublicReport page)
-- =====================================================
DROP POLICY IF EXISTS "Public can view report settings" ON public.report_settings;

CREATE POLICY "Public can view report settings for public scans"
ON public.report_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.competitor_scans cs
    WHERE cs.user_id = report_settings.user_id
    AND cs.is_public = true
  )
);

-- =====================================================
-- FIX 3: Content Items - Remove public read of published
-- content which exposes sensitive SEO strategy fields
-- (serp_research, seo_score, structured_data, draft_content)
-- No public-facing page queries content_items directly
-- =====================================================
DROP POLICY IF EXISTS "Public can read published content" ON public.content_items;

-- =====================================================
-- FIX 4: Competitor Scans - Tighten public SELECT to only
-- return domain + id for public scans (can't restrict columns
-- via RLS, so we keep the policy but the scan_results, 
-- keywords_found, meta_patterns are intentionally shared 
-- as part of the public report feature). Mark as reviewed.
-- The existing policy is correct for the public report use case.
-- =====================================================
-- No change needed - the is_public flag is intentional design.
-- The policy already restricts to (is_public = true) OR (auth.uid() = user_id).
