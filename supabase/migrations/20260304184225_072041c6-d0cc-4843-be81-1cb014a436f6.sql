
-- Create a security definer function to check admin email
CREATE OR REPLACE FUNCTION public.is_daniela_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND email = 'pedro.acn@consultant.com'
  )
$$;

-- Drop old policies
DROP POLICY IF EXISTS "Only admin can view daniela leads" ON public.daniela_leads;
DROP POLICY IF EXISTS "Only admin can delete daniela leads" ON public.daniela_leads;

-- Recreate with security definer function
CREATE POLICY "Only admin can view daniela leads"
ON public.daniela_leads FOR SELECT
TO authenticated
USING (public.is_daniela_admin(auth.uid()));

CREATE POLICY "Only admin can delete daniela leads"
ON public.daniela_leads FOR DELETE
TO authenticated
USING (public.is_daniela_admin(auth.uid()));
