
-- Remove the overly permissive insert policy - service role bypasses RLS anyway
DROP POLICY "Service role can insert notifications" ON public.notifications;
