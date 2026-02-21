
CREATE TABLE public.daniela_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daniela_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert leads
CREATE POLICY "Anyone can insert daniela leads"
ON public.daniela_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only Pedro (admin) can view leads - we use email check via auth
CREATE POLICY "Only admin can view daniela leads"
ON public.daniela_leads FOR SELECT
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'pedro.acn@consultant.com'
);

-- Only admin can delete
CREATE POLICY "Only admin can delete daniela leads"
ON public.daniela_leads FOR DELETE
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'pedro.acn@consultant.com'
);
