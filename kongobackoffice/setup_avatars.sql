-- 1. Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create avatars storage bucket (if it does not exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for the 'avatars' bucket

-- Enable read access for everyone
CREATE POLICY "Public avatars access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
-- They can upload their own avatars or admins can upload for staff
CREATE POLICY "Avatar upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Allow authenticated users to update their avatars
CREATE POLICY "Avatar update access"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to delete their avatars
CREATE POLICY "Avatar delete access"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' );
