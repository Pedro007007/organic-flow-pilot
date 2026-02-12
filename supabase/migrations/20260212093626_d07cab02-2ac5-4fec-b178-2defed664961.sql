
-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  
  -- Voice & Style
  tone_of_voice TEXT DEFAULT 'professional',
  writing_style TEXT DEFAULT 'expert, concise, practical',
  writing_preferences JSONB DEFAULT '{"avoid_cliches": true, "first_person": false, "scannable_format": true, "min_word_count": 1500, "max_word_count": 3000}'::jsonb,
  
  -- SEO Settings
  seo_settings JSONB DEFAULT '{"default_schema_types": ["Article", "FAQPage"], "meta_title_suffix": "", "focus_search_intent": "informational", "target_positions": [8, 30]}'::jsonb,
  
  -- Image Defaults
  image_defaults JSONB DEFAULT '{"style": "modern, clean", "color_palette": "", "aspect_ratio": "16:9", "include_body_images": true, "body_image_count": 2}'::jsonb,
  
  -- Internal Linking
  internal_linking_config JSONB DEFAULT '{"enabled": true, "max_links": 5, "prefer_sitemap": true, "anchor_style": "natural"}'::jsonb,
  
  -- Research
  research_depth TEXT DEFAULT 'standard',
  
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own brands" ON public.brands
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own brands" ON public.brands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands" ON public.brands
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own brands" ON public.brands
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add brand_id to content_items so each piece of content is tied to a brand
ALTER TABLE public.content_items ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Add brand_id to sitemap_pages (for later sitemap sync feature)
-- We'll create the sitemap_pages table now too since it's next in priority

CREATE TABLE public.sitemap_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sitemap_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sitemap pages" ON public.sitemap_pages
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own sitemap pages" ON public.sitemap_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sitemap pages" ON public.sitemap_pages
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own sitemap pages" ON public.sitemap_pages
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for brands
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
