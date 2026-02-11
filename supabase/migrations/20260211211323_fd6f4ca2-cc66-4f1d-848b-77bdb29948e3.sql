ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS webhook_secret text DEFAULT '',
  ADD COLUMN IF NOT EXISTS revalidation_prefix text DEFAULT '/blog';