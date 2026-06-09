-- Bảng danh sách người nhận công văn
CREATE TABLE IF NOT EXISTS public.document_recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Chưa xem' CHECK (status IN ('Chưa xem', 'Đã xem')),
  processing_status TEXT DEFAULT 'Chưa xử lý' CHECK (processing_status IN ('Chưa xử lý', 'Đã trả lời/báo cáo', 'Đã chuyển tiếp', 'Hoàn thành')),
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng báo cáo xử lý công văn
CREATE TABLE IF NOT EXISTS public.document_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  issues TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bucket lưu trữ cho file báo cáo và công văn (nếu chưa có)
-- Chạy trên Supabase Dashboard -> Storage -> New Bucket (Tên: documents)

-- RLS (Row Level Security) cho các bảng (Tuỳ chỉnh theo yêu cầu bảo mật của dự án)
ALTER TABLE public.document_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả đọc document_recipients" ON public.document_recipients FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả thêm document_recipients" ON public.document_recipients FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép tất cả cập nhật document_recipients" ON public.document_recipients FOR UPDATE USING (true);

CREATE POLICY "Cho phép tất cả đọc document_reports" ON public.document_reports FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả thêm document_reports" ON public.document_reports FOR INSERT WITH CHECK (true);
