'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Bạn chưa đăng nhập')
  }

  // Lấy dữ liệu từ form
  const title = formData.get('title') as string
  const priority = formData.get('priority') as string
  const due_date = formData.get('due_date') as string
  const assigner_name = formData.get('assigner_name') as string
  const status = formData.get('status') as string

  // Validate basic
  if (!title) {
    throw new Error('Vui lòng nhập tên công việc')
  }

  // Ghi vào CSDL
  const { error } = await supabase
    .from('tasks')
    .insert({
      title,
      progress: 0, // Mặc định khi tạo mới tiến độ là 0%
      priority,
      due_date: due_date ? new Date(due_date).toISOString() : null,
      assigner_name,
      status,
      created_by: user.id
    })

  if (error) {
    console.error('Error creating task:', error)
    throw new Error('Có lỗi xảy ra khi tạo công việc mới')
  }

  // Refresh lại danh sách và chuyển hướng
  revalidatePath('/tasks')
  redirect('/tasks')
}
