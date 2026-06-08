'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const symbol_number = formData.get('symbol_number') as string
  const summary = formData.get('summary') as string
  const type = formData.get('type') as string
  const content = formData.get('content') as string
  const priority = formData.get('priority') === 'on'
  const sendAll = formData.get('send_all') === 'on'
  
  // Xử lý selected_users từ form data (gửi dưới dạng chuỗi JSON)
  const selectedUsersStr = formData.get('selected_users') as string
  const selectedUsers = selectedUsersStr ? JSON.parse(selectedUsersStr) : []

  const { error, data: insertedDoc } = await supabase
    .from('documents')
    .insert([
      {
        symbol_number,
        summary,
        type,
        priority,
        status: 'Chưa xử lý',
        created_by: user.id,
        // Có thể lưu nội dung (content) nếu có cột tương ứng trong database
      }
    ])
    .select()
    .single()

  if (!error && insertedDoc && selectedUsers.length > 0) {
      // Giả sử có bảng recipients hoặc gửi thông báo
      // Insert recipients - tuỳ thuộc vào cấu trúc database
  }

  if (!error) {
    redirect('/documents/incoming')
  }
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
