
-- Rankings table: daily position snapshots per URL/keyword
CREATE TABLE public.rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  position NUMERIC,
  previous_position NUMERIC,
  ai_cited BOOLEAN NOT NULL DEFAULT false,
  ai_engine TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rankings" ON public.rankings FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own rankings" ON public.rankings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rankings" ON public.rankings FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own rankings" ON public.rankings FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_rankings_user_date ON public.rankings (user_id, snapshot_date);

-- AI Citations table
CREATE TABLE public.ai_citations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  engine TEXT NOT NULL,
  cited BOOLEAN NOT NULL DEFAULT false,
  snippet TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own citations" ON public.ai_citations FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own citations" ON public.ai_citations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own citations" ON public.ai_citations FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own citations" ON public.ai_citations FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- SEO Fulfilment table
CREATE TABLE public.seo_fulfilment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  criterion TEXT NOT NULL,
  category TEXT NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  details TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_fulfilment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fulfilment" ON public.seo_fulfilment FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own fulfilment" ON public.seo_fulfilment FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fulfilment" ON public.seo_fulfilment FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own fulfilment" ON public.seo_fulfilment FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_fulfilment_content ON public.seo_fulfilment (content_item_id);

-- Competitor Scans table
CREATE TABLE public.competitor_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  scan_results JSONB DEFAULT '{}'::jsonb,
  keywords_found JSONB DEFAULT '[]'::jsonb,
  schema_types TEXT[] DEFAULT '{}'::text[],
  meta_patterns JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.competitor_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans" ON public.competitor_scans FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own scans" ON public.competitor_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scans" ON public.competitor_scans FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own scans" ON public.competitor_scans FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- SEO Checklists table
CREATE TABLE public.seo_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_label TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  auto_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklists" ON public.seo_checklists FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own checklists" ON public.seo_checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklists" ON public.seo_checklists FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own checklists" ON public.seo_checklists FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_checklists_user ON public.seo_checklists (user_id);
CREATE INDEX idx_checklists_content ON public.seo_checklists (content_item_id);
