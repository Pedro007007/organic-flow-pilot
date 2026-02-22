
-- Add is_public flag to competitor_scans (default true so existing scans remain accessible for shared reports)
ALTER TABLE public.competitor_scans ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view scans by id" ON public.competitor_scans;

-- Create restricted policy: public can only view scans explicitly marked as public, owners can always see their own
CREATE POLICY "Public can view public scans" ON public.competitor_scans
  FOR SELECT TO anon, authenticated
  USING (is_public = true OR auth.uid() = user_id);
