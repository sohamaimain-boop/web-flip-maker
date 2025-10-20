-- Create flipbooks table
CREATE TABLE public.flipbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  pdf_storage_path TEXT,
  thumbnail_path TEXT,
  background_color TEXT DEFAULT '#FFFFFF',
  background_image_path TEXT,
  logo_image_path TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.flipbooks ENABLE ROW LEVEL SECURITY;

-- Create policies for flipbooks
CREATE POLICY "Users can view their own flipbooks"
  ON public.flipbooks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flipbooks"
  ON public.flipbooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flipbooks"
  ON public.flipbooks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flipbooks"
  ON public.flipbooks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public viewing of flipbooks (for public pages)
CREATE POLICY "Public can view ready flipbooks"
  ON public.flipbooks
  FOR SELECT
  USING (status = 'ready');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_flipbooks_updated_at
  BEFORE UPDATE ON public.flipbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('pdfs', 'pdfs', false),
  ('thumbnails', 'thumbnails', true),
  ('logos', 'logos', true),
  ('backgrounds', 'backgrounds', true);

-- Storage policies for PDFs (private)
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own PDFs"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own PDFs"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for thumbnails (public)
CREATE POLICY "Anyone can view thumbnails"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload thumbnails"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for logos (public)
CREATE POLICY "Anyone can view logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Users can upload logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own logos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for backgrounds (public)
CREATE POLICY "Anyone can view backgrounds"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'backgrounds');

CREATE POLICY "Users can upload backgrounds"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'backgrounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own backgrounds"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'backgrounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );