
-- Add new columns to content_items
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS serp_research jsonb;

-- Create content-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to content-images
CREATE POLICY "Authenticated users can upload content images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'content-images' AND auth.uid() IS NOT NULL);

-- Allow public read access
CREATE POLICY "Content images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their content images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'content-images' AND auth.uid() IS NOT NULL);

-- Allow users to delete their content images
CREATE POLICY "Users can delete their content images"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-images' AND auth.uid() IS NOT NULL);
