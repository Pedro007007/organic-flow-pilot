
CREATE TABLE public.content_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  version_label TEXT,
  draft_content TEXT,
  seo_title TEXT,
  meta_description TEXT,
  slug TEXT,
  hero_image_url TEXT,
  schema_types TEXT[] DEFAULT '{}',
  seo_score INTEGER,
  aeo_score INTEGER,
  optimization_scores JSONB,
  optimization_action_plan JSONB,
  aeo_scores JSONB,
  aeo_recommendations JSONB,
  internal_links JSONB,
  external_links JSONB,
  word_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX content_versions_item_version ON public.content_versions(content_item_id, version_number);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own versions" ON public.content_versions FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own versions" ON public.content_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own versions" ON public.content_versions FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own versions" ON public.content_versions FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
