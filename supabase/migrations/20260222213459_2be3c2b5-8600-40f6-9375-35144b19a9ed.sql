
-- 1. daniela_leads: Add validation trigger for email format and length limits
CREATE OR REPLACE FUNCTION public.validate_daniela_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or less';
  END IF;
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be 255 characters or less';
  END IF;
  IF length(NEW.phone) > 30 THEN
    RAISE EXCEPTION 'Phone must be 30 characters or less';
  END IF;
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_daniela_lead ON public.daniela_leads;
CREATE TRIGGER trg_validate_daniela_lead
  BEFORE INSERT ON public.daniela_leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_daniela_lead();

-- 2. Storage: Fix content-images UPDATE and DELETE policies to check ownership
DROP POLICY IF EXISTS "Users can update their content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their content images" ON storage.objects;

CREATE POLICY "Users can update own content images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'content-images' AND auth.uid() IS NOT NULL AND owner = auth.uid());

CREATE POLICY "Users can delete own content images"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-images' AND auth.uid() IS NOT NULL AND owner = auth.uid());

-- 3. report_leads: Replace open INSERT policy with validated one
DROP POLICY IF EXISTS "Anyone can insert report leads" ON public.report_leads;

CREATE POLICY "Validated report lead insertion"
ON public.report_leads FOR INSERT
TO anon, authenticated
WITH CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(email) <= 255
  AND scan_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.competitor_scans WHERE id = scan_id AND is_public = true)
);
