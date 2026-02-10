
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Only admins can view all invites
CREATE POLICY "Admins can view all invites"
  ON public.team_invites FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create invites
CREATE POLICY "Admins can insert invites"
  ON public.team_invites FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update invites
CREATE POLICY "Admins can update invites"
  ON public.team_invites FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete invites
CREATE POLICY "Admins can delete invites"
  ON public.team_invites FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
