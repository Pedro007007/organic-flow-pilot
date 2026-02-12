
-- Create repurposed_content table
CREATE TABLE public.repurposed_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'youtube', 'twitter')),
  output TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.repurposed_content ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own repurposed content"
  ON public.repurposed_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repurposed content"
  ON public.repurposed_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repurposed content"
  ON public.repurposed_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repurposed content"
  ON public.repurposed_content FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_repurposed_content_item ON public.repurposed_content(content_item_id, channel);
