
-- Report settings table
CREATE TABLE public.report_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  headline_text TEXT NOT NULL DEFAULT 'Your SEO Report',
  headline_size TEXT NOT NULL DEFAULT 'medium',
  subheadline_text TEXT DEFAULT 'See how your website performs across key SEO metrics',
  show_headline BOOLEAN NOT NULL DEFAULT true,
  show_subheadline BOOLEAN NOT NULL DEFAULT true,
  hide_blurbs BOOLEAN NOT NULL DEFAULT false,
  show_legal_links BOOLEAN NOT NULL DEFAULT true,
  show_disclaimer BOOLEAN NOT NULL DEFAULT true,
  disclaimer_text TEXT DEFAULT 'This report is generated automatically and may not reflect real-time data.',
  colors JSONB NOT NULL DEFAULT '{"primary":"#6366f1","background":"#ffffff","accent":"#f59e0b"}'::jsonb,
  cta_blocks JSONB NOT NULL DEFAULT '[
    {"id":"competitor","title":"Competitor Analysis","description":"See how you stack up against competitors","button_text":"Learn More","redirect_url":"","enabled":true},
    {"id":"content","title":"Content Strategy Insights","description":"Get actionable content recommendations","button_text":"Get Started","redirect_url":"","enabled":true},
    {"id":"traffic","title":"Traffic and Performance","description":"Understand your traffic patterns","button_text":"View Details","redirect_url":"","enabled":true},
    {"id":"seasonal","title":"Seasonal SEO Trends","description":"Capitalize on seasonal search trends","button_text":"Explore","redirect_url":"","enabled":false}
  ]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report settings" ON public.report_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own report settings" ON public.report_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own report settings" ON public.report_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own report settings" ON public.report_settings FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_report_settings_updated_at BEFORE UPDATE ON public.report_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Report leads table
CREATE TABLE public.report_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.competitor_scans(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.report_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report leads" ON public.report_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert report leads" ON public.report_leads FOR INSERT WITH CHECK (true);

-- Allow public read of competitor_scans by ID for public reports
CREATE POLICY "Public can view scans by id" ON public.competitor_scans FOR SELECT USING (true);

-- Allow public read of report_settings by user_id for public reports  
CREATE POLICY "Public can view report settings" ON public.report_settings FOR SELECT USING (true);
