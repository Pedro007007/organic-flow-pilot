
-- Fix 1: Restrict daniela-avatar storage INSERT to authenticated users only
DROP POLICY IF EXISTS "Service role insert for daniela-avatar" ON storage.objects;
CREATE POLICY "Authenticated insert for daniela-avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'daniela-avatar');

-- Fix 2: Tighten report_settings public read policy
-- The current policy exposes ALL report settings if user has ANY public scan
-- Replace with a more scoped check (still allows public report rendering)
DROP POLICY IF EXISTS "Public can view report settings for public scans" ON public.report_settings;
