-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated'
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars' AND 
    auth.role() = 'authenticated' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
