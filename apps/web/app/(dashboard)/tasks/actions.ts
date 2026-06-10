'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createNotification } from '@/app/actions/notifications'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Bạn chưa đăng nhập' }
  }

  // Lấy dữ liệu từ form
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string
  const due_date = formData.get('due_date') as string
  const status = 'pending' // Trạng thái mặc định
  
  const selectedUsersStr = formData.get('selected_users') as string
  const selectedUsers = selectedUsersStr ? JSON.parse(selectedUsersStr) : []

  if (!title) {
    return { error: 'Vui lòng nhập tên công việc' }
  }

  // Handle attachments
  const files = formData.getAll('attachments') as File[]
  const uploadedAttachments: { name: string; url: string; size: number }[] = []

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  for (const file of files) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `tasks/${user.id}/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(filePath, file)

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('documents')
          .getPublicUrl(filePath)
          
        uploadedAttachments.push({
          name: file.name,
          url: publicUrlData.publicUrl,
          size: file.size
        })
      }
    }
  }

  // Ghi vào CSDL tasks
  const { error, data: insertedTask } = await supabaseAdmin
    .from('tasks')
    .insert({
      title,
      description,
      progress: 0,
      priority,
      due_date: due_date ? new Date(due_date).toISOString() : null,
      status,
      created_by: user.id,
      attachments: uploadedAttachments
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    return { error: 'Có lỗi xảy ra khi tạo công việc mới: ' + (error.message || JSON.stringify(error)) }
  }

  // Tạo recipients
  if (!error && insertedTask && selectedUsers.length > 0) {
    const recipientsData = selectedUsers.map((userId: string) => ({
      task_id: insertedTask.id,
      user_id: userId,
      status: 'Chưa xem',
      processing_status: 'Chưa xử lý'
    }))
    
    const { error: recipientsError } = await supabaseAdmin
      .from('task_recipients')
      .insert(recipientsData)

    if (recipientsError) {
      console.error('Error inserting task recipients:', recipientsError)
    } else {
      // Gửi thông báo cho người nhận
      for (const userId of selectedUsers) {
        await createNotification(userId, `Bạn vừa được phân công công việc mới: ${title}`, insertedTask.id)
      }
    }
  }

  revalidatePath('/tasks/incoming')
  revalidatePath('/tasks/sent')

  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Bạn chưa đăng nhập' }
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Kiểm tra quyền xoá (phải là người tạo)
  const { data: task } = await supabaseAdmin
    .from('tasks')
    .select('created_by')
    .eq('id', taskId)
    .single()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!task || (task.created_by !== user.id && !profile?.is_admin)) {
    return { error: 'Bạn không có quyền xoá công việc này' }
  }

  const { error } = await supabaseAdmin
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/tasks/sent')
  return { success: true }
}

export async function getUsers() {
  const supabase = await createClient()
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, department, role, avatar_url')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  return users || []
}
