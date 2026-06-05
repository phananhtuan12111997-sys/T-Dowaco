'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createNews(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Bạn chưa đăng nhập')
  }

  // Lấy dữ liệu từ form
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const author_name = formData.get('author_name') as string
  
  // Xử lý Checkbox có đính kèm
  const has_attachment = formData.get('has_attachment') === 'on'

  // Validate basic
  if (!title || !content) {
    throw new Error('Vui lòng nhập đầy đủ tiêu đề và nội dung')
  }

  // Ghi vào CSDL
  const { error } = await supabase
    .from('news')
    .insert({
      title,
      content,
      author_name: author_name || 'Văn phòng Điện tử', // Mặc định nếu không nhập
      has_attachment,
      created_by: user.id
    })

  if (error) {
    console.error('Error creating news:', error)
    throw new Error('Có lỗi xảy ra khi đăng tin mới')
  }

  // Refresh lại danh sách và chuyển hướng
  revalidatePath('/news')
  redirect('/news')
}
