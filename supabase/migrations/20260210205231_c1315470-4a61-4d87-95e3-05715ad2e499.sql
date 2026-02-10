
-- Create table for storing GSC OAuth connections
CREATE TABLE public.gsc_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  refresh_token text NOT NULL,
  access_token text,
  token_expires_at timestamptz,
  site_url text,
  connected_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gsc_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connection
CREATE POLICY "Users can view own gsc connection"
ON public.gsc_connections FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own connection
CREATE POLICY "Users can insert own gsc connection"
ON public.gsc_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own connection
CREATE POLICY "Users can update own gsc connection"
ON public.gsc_connections FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own connection
CREATE POLICY "Users can delete own gsc connection"
ON public.gsc_connections FOR DELETE
USING (auth.uid() = user_id);
