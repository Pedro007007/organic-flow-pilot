INSERT INTO storage.buckets (id, name, public) VALUES ('daniela-avatar', 'daniela-avatar', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for daniela-avatar" ON storage.objects FOR SELECT USING (bucket_id = 'daniela-avatar');

CREATE POLICY "Service role insert for daniela-avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'daniela-avatar');