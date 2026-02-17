
-- Phase 1: LLM Search Sessions table
CREATE TABLE public.llm_search_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  queries jsonb DEFAULT '[]'::jsonb,
  keyword_matches jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.llm_search_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own llm sessions"
  ON public.llm_search_sessions FOR SELECT
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own llm sessions"
  ON public.llm_search_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own llm sessions"
  ON public.llm_search_sessions FOR DELETE
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: AEO Scores table
CREATE TABLE public.aeo_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id uuid NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  overall_score integer DEFAULT 0,
  scores jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.aeo_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own aeo scores"
  ON public.aeo_scores FOR SELECT
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own aeo scores"
  ON public.aeo_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own aeo scores"
  ON public.aeo_scores FOR UPDATE
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own aeo scores"
  ON public.aeo_scores FOR DELETE
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Phase 3: Add structured_data column to content_items
ALTER TABLE public.content_items ADD COLUMN structured_data jsonb DEFAULT NULL;

-- Indexes
CREATE INDEX idx_llm_sessions_user ON public.llm_search_sessions(user_id);
CREATE INDEX idx_aeo_scores_content ON public.aeo_scores(content_item_id);
CREATE INDEX idx_aeo_scores_user ON public.aeo_scores(user_id);
