-- Allow public reading of published/monitoring blog posts
-- (Currently SELECT is restricted to the row owner)

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_items'
      AND policyname = 'Public can read published content'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Public can read published content"
      ON public.content_items
      FOR SELECT
      TO anon, authenticated
      USING (
        status IN ('published', 'monitoring')
        AND slug IS NOT NULL
      );
    $pol$;
  END IF;
END $$;