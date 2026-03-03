ALTER TABLE public.content_items
  ADD COLUMN context text,
  ADD COLUMN reference_links text[],
  ADD COLUMN extra_keywords text[];