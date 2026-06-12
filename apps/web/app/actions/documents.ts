'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function deleteDocument(documentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Initialize Admin client to bypass RLS
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Fetch document to ensure sender is current user
  const { data: doc, error: docError } = await supabaseAdmin
    .from('documents')
    .select('created_by, summary, symbol_number')
    .eq('id', documentId)
    .single()

  if (docError || !doc) return { error: 'Document not found' }
  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin
  
  if (doc.created_by !== user.id && !isITAdmin) return { error: 'Forbidden' }

  // 2. Fetch recipients to notify them
  const { data, error } = await supabaseAdmin
    .from('document_recipients')
    .select('user_id, status, processing_status')
    .eq('document_id', documentId)

  // 3. Delete related data using Admin client
  await supabaseAdmin.from('notifications').delete().eq('document_id', documentId)
  await supabaseAdmin.from('document_reports').delete().eq('document_id', documentId)
  await supabaseAdmin.from('document_recipients').delete().eq('document_id', documentId)

  const { error: deleteError } = await supabaseAdmin
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (deleteError) return { error: deleteError.message }

  // 4. Send notification to recipients who viewed/processed it
  if (data && data.length > 0) {
    const notifyUsers = data
      .filter(r => r.status !== 'Chưa xem' || r.processing_status !== 'Chưa xử lý')
      .map(r => r.user_id)

    if (notifyUsers.length > 0) {
      const notificationsData = notifyUsers.map(userId => ({
        user_id: userId,
        document_id: null,
        message: `Công văn "${doc.symbol_number} - ${doc.summary}" đã bị xóa bởi người gửi.`,
        is_read: false
      }))

      await supabaseAdmin.from('notifications').insert(notificationsData)
    }
  }

  revalidatePath('/cong-van/di')
  return { success: true }
}

export async function updateDocument(documentId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const symbol_number = formData.get('symbol_number') as string
  const summary = formData.get('summary') as string
  const type = formData.get('type') as string
  const content = formData.get('content') as string
  const priority = formData.get('urgency') === 'Quan trọng' || formData.get('priority') === 'on'
  
  // existing attachments
  const existingAttachmentsStr = formData.get('existing_attachments') as string
  const existingAttachments = existingAttachmentsStr ? JSON.parse(existingAttachmentsStr) : []

  // Handle new attachments
  const files = formData.getAll('attachments') as File[]
  const newAttachments: { name: string; url: string; size: number }[] = []

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: doc, error: docError } = await supabaseAdmin
    .from('documents')
    .select('created_by')
    .eq('id', documentId)
    .single()

  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin

  if (!doc || (doc.created_by !== user.id && !isITAdmin)) {
    return { error: 'Forbidden' }
  }

  for (const file of files) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `created_docs/${user.id}/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(filePath, file)

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('documents')
          .getPublicUrl(filePath)
          
        newAttachments.push({
          name: file.name,
          url: publicUrlData.publicUrl,
          size: file.size
        })
      }
    }
  }

  const finalAttachments = [...existingAttachments, ...newAttachments]

  const { error: updateError } = await supabaseAdmin
    .from('documents')
    .update({
      symbol_number,
      summary,
      type,
      priority,
      content,
      attachments: finalAttachments
    })
    .eq('id', documentId)

  if (updateError) {
    console.error('Error updating document:', updateError)
    return { error: updateError.message }
  }

  // Handle recipients
  const selectedUsersStr = formData.get('selected_users') as string
  const selectedUsers = selectedUsersStr ? JSON.parse(selectedUsersStr) : []
  
  const { data: currentRecipients } = await supabaseAdmin
    .from('document_recipients')
    .select('user_id, status, processing_status')
    .eq('document_id', documentId)
    
  const currentRecipientIds = currentRecipients?.map(r => r.user_id) || []
  
  // Find added recipients
  const newRecipientIds = selectedUsers.filter((id: string) => !currentRecipientIds.includes(id))
  
  // Add new recipients
  if (newRecipientIds.length > 0) {
    const recipientsData = newRecipientIds.map((userId: string) => ({
      document_id: documentId,
      user_id: userId,
      status: 'Chưa xem',
      processing_status: 'Chưa xử lý'
    }))
    await supabaseAdmin.from('document_recipients').insert(recipientsData)
    
    const newNotificationsData = newRecipientIds.map((userId: string) => ({
      user_id: userId,
      document_id: documentId,
      message: `Bạn có công văn mới: ${summary}`,
      is_read: false
    }))
    await supabaseAdmin.from('notifications').insert(newNotificationsData)
  }

  // Remove removed recipients (only if they haven't processed it, or maybe allow force remove?)
  const removedRecipientIds = currentRecipientIds.filter((id: string) => !selectedUsers.includes(id))
  if (removedRecipientIds.length > 0) {
    await supabaseAdmin.from('document_recipients')
      .delete()
      .eq('document_id', documentId)
      .in('user_id', removedRecipientIds)
      
    // Remove their notifications related to this document
    await supabaseAdmin.from('notifications')
      .delete()
      .eq('document_id', documentId)
      .in('user_id', removedRecipientIds)
  }

  // Notify existing recipients who already viewed/processed about the edit
  const notifyUsers = currentRecipients
    ?.filter(r => !removedRecipientIds.includes(r.user_id))
    ?.filter(r => r.status !== 'Chưa xem' || r.processing_status !== 'Chưa xử lý')
    ?.map(r => r.user_id) || []

  if (notifyUsers.length > 0) {
    const editNotifs = notifyUsers.map((userId: string) => ({
      user_id: userId,
      document_id: documentId, // They can still view the edited document
      message: `Công văn "${symbol_number} - ${summary}" vừa được cập nhật nội dung/tệp đính kèm.`,
      is_read: false
    }))
    await supabaseAdmin.from('notifications').insert(editNotifs)
  }

  return { success: true }
}
