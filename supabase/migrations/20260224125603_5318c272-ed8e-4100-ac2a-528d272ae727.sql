
-- Remove the overly permissive public INSERT policy on report_leads.
-- Insertions now go through the report-lead-capture edge function (service role),
-- so no client-side INSERT policy is needed.
DROP POLICY IF EXISTS "Validated report lead insertion" ON public.report_leads;

-- Add a strict INSERT policy: only authenticated users who own the scan can insert
-- (This is a fallback; primary insertion is via edge function with service role)
CREATE POLICY "Authenticated users can insert own report leads"
ON public.report_leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
