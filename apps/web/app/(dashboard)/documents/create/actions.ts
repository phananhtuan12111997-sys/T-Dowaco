'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const symbol_number = formData.get('symbol_number') as string
  const summary = formData.get('summary') as string
  const type = formData.get('type') as string
  const content = formData.get('content') as string
  const priority = formData.get('urgency') === 'Quan trọng' || formData.get('priority') === 'on'
  const sendAll = formData.get('send_all') === 'on'
  
  const selectedUsersStr = formData.get('selected_users') as string
  const selectedUsers = selectedUsersStr ? JSON.parse(selectedUsersStr) : []

  const forwardFromId = formData.get('forwardFromId') as string || null
  const initialAttachmentsStr = formData.get('initialAttachments') as string
  const initialAttachments = initialAttachmentsStr ? JSON.parse(initialAttachmentsStr) : []

  // Handle attachments
  const files = formData.getAll('attachments') as File[]
  const uploadedAttachments: { name: string; url: string; size: number }[] = [...initialAttachments]

  for (const file of files) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `created_docs/${user.id}/${fileName}`

      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

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

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error, data: insertedDoc } = await supabaseAdmin
    .from('documents')
    .insert([
      {
        symbol_number,
        summary,
        type,
        priority,
        status: 'Chưa xử lý',
        created_by: user.id,
        content,
        attachments: uploadedAttachments,
        forwarded_from_id: forwardFromId
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error inserting document:', error)
    return { error: error.message }
  }

  if (!error && insertedDoc && selectedUsers.length > 0) {
      // Create recipients
      const recipientsData = selectedUsers.map((userId: string) => ({
        document_id: insertedDoc.id,
        user_id: userId,
        status: 'Chưa xem',
        processing_status: 'Chưa xử lý'
      }))
      
      const { error: recipientsError } = await supabaseAdmin
        .from('document_recipients')
        .insert(recipientsData)

      if (recipientsError) {
        console.error('Error inserting recipients:', recipientsError)
      }

      if (!recipientsError) {
        // Cập nhật trạng thái "Đã chuyển tiếp" cho tài liệu gốc nếu đây là chuyển tiếp
        if (forwardFromId) {
          await supabaseAdmin
            .from('document_recipients')
            .update({ processing_status: 'Đã chuyển tiếp' })
            .eq('document_id', forwardFromId)
            .eq('user_id', user.id)
        }
        // Insert notifications
        const notificationsData = selectedUsers.map((userId: string) => ({
          user_id: userId,
          document_id: insertedDoc.id,
          message: `Bạn có công văn mới: ${summary}`,
          is_read: false
        }))
        
        const { error: notifError } = await supabaseAdmin
          .from('notifications')
          .insert(notificationsData)

        if (notifError) {
           console.error('Error inserting notifications:', notifError)
        }
      }
  }

  if (!error) {
    return { success: true }
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
