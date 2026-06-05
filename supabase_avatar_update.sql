-- 1. Thêm cột avatar_url vào bảng profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Tạo bucket 'avatars' nếu chưa có
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Cho phép truy cập Public để tải ảnh (SELECT)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- 4. Cho phép User đã đăng nhập (authenticated) được upload ảnh (INSERT)
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- 5. Cho phép User đã đăng nhập (authenticated) được cập nhật ảnh (UPDATE)
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars');
