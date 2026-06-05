'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createMeeting(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Bạn chưa đăng nhập')
  }

  // Trong thực tế sẽ có 1 bước kiểm tra quyền "Ban điều hành" ở đây.
  // Ví dụ: const profile = await getProfile(user.id); if (profile.role !== 'executive') throw Error(...)

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const room = formData.get('room') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string

  if (!title || !start_time || !end_time) {
    throw new Error('Vui lòng nhập đầy đủ Tiêu đề và Thời gian')
  }

  const { error } = await supabase
    .from('meetings')
    .insert({
      title,
      description,
      room,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      status: 'Đã duyệt', // Auto duyệt vì Ban điều hành tạo
      created_by: user.id
    })

  if (error) {
    console.error('Error creating meeting:', error)
    throw new Error('Có lỗi xảy ra khi tạo lịch họp')
  }

  revalidatePath('/meetings')
  redirect('/meetings')
}
