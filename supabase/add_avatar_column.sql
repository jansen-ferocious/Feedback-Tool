-- Add avatar_url column to team_members
-- Run this in Supabase SQL Editor

ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars (run separately if bucket exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "avatars_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "avatars_view" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');
