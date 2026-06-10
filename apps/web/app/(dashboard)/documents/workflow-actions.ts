'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification, createGroupedNotification } from '@/app/actions/notifications'

// Helper to get supabase admin for inserting/updating rows that might be restricted by RLS
async function getSupabaseAdmin() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function acceptDocument(documentId: string) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return { error: 'Unauthorized' }

    const supabaseAdmin = await getSupabaseAdmin()

    // Update recipient status
    const { error: updateError } = await supabaseAdmin
      .from('document_recipients')
      .update({ processing_status: 'Đang thực hiện', status: 'Đã xem' })
      .match({ document_id: documentId, user_id: userData.user.id })

    if (updateError) return { error: 'Update recipient failed: ' + updateError.message }

    // Add timeline event
    const { error: insertError } = await supabaseAdmin
      .from('document_comments')
      .insert({
        document_id: documentId,
        user_id: userData.user.id,
        content: 'Đã tiếp nhận công văn',
        action_type: 'accept'
      })

    if (insertError) return { error: 'Insert comment failed: ' + insertError.message }

    // Notification
    const { data: document } = await supabaseAdmin.from('documents').select('created_by, title, summary').eq('id', documentId).single()
    const { data: recipientList } = await supabaseAdmin.from('document_recipients').select('forwarded_from').match({ document_id: documentId, user_id: userData.user.id }).limit(1)
    const recipient = recipientList?.[0]
    
    if (document) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
      const name = profile?.full_name || 'Một người dùng'
      
      await createGroupedNotification(document.created_by, documentId, `đã tiếp nhận công văn: ${document.summary || document.title}`, name, 'đã tiếp nhận công văn')
      
      if (recipient?.forwarded_from && recipient.forwarded_from !== document.created_by) {
        await createGroupedNotification(recipient.forwarded_from, documentId, `đã tiếp nhận công văn được chuyển tiếp: ${document.summary || document.title}`, name, 'đã tiếp nhận công văn được chuyển tiếp')
      }
    }

    revalidatePath(`/documents/incoming/${documentId}`)
    revalidatePath('/documents/incoming')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Lỗi không xác định' }
  }
}

export async function reportDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const documentId = formData.get('documentId') as string
  const content = formData.get('content') as string
  const files = formData.getAll('attachments') as File[]

  const supabaseAdmin = await getSupabaseAdmin()

  const uploadedAttachments = []
  for (const file of files) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `reports/${documentId}/${fileName}`

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
          size: file.size,
          type: file.type
        })
      }
    }
  }

  // Update recipient status
  await supabaseAdmin
    .from('document_recipients')
    .update({ processing_status: 'Chờ duyệt' })
    .match({ document_id: documentId, user_id: userData.user.id })

  // Add timeline event
  await supabaseAdmin
    .from('document_comments')
    .insert({
      document_id: documentId,
      user_id: userData.user.id,
      content: content || 'Đã gửi báo cáo',
      action_type: 'report',
      files: uploadedAttachments.length > 0 ? uploadedAttachments : null
    })

  // Notification
  const { data: document } = await supabaseAdmin.from('documents').select('created_by, title, summary').eq('id', documentId).single()
  const { data: recipientList } = await supabaseAdmin.from('document_recipients').select('forwarded_from').match({ document_id: documentId, user_id: userData.user.id }).limit(1)
  const recipient = recipientList?.[0]
  
  if (document) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = profile?.full_name || 'Một người dùng'
    
    // Gửi thông báo cho người giao trực tiếp
    const approverId = recipient?.forwarded_from || document.created_by
    await createGroupedNotification(approverId, documentId, `đã gửi báo cáo công văn: ${document.summary || document.title}`, name, 'đã gửi báo cáo công văn')
  }

  revalidatePath(`/documents/incoming/${documentId}`)
  revalidatePath('/documents/incoming')
  return { success: true }
}

export async function forwardDocument(documentId: string, userIds: string[], note: string = '') {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return { error: 'Unauthorized' }

    const supabaseAdmin = await getSupabaseAdmin()

    // Thêm người nhận mới
    const recipients = userIds.map(id => ({
      document_id: documentId,
      user_id: id,
      status: 'Chưa xem',
      processing_status: 'Chưa xử lý',
      forwarded_from: userData.user.id
    }))

    await supabaseAdmin.from('document_recipients').insert(recipients)

    // Cập nhật trạng thái người chuyển tiếp
    await supabaseAdmin
      .from('document_recipients')
      .update({ processing_status: 'Đã chuyển tiếp' })
      .match({ document_id: documentId, user_id: userData.user.id })

    // Add timeline event
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name').in('id', userIds)
    const forwardedToNames = profiles?.map(p => p.full_name).join(', ') || 'nhiều người'

    await supabaseAdmin
      .from('document_comments')
      .insert({
        document_id: documentId,
        user_id: userData.user.id,
        content: note || `Đã chuyển tiếp công văn cho ${forwardedToNames}`,
        action_type: 'forward'
      })

    // Notification
    const { data: document } = await supabaseAdmin.from('documents').select('title, summary').eq('id', documentId).single()
    
    if (document) {
      const { data: currentProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
      const name = currentProfile?.full_name || 'Người chuyển tiếp'

      for (const userId of userIds) {
        await createGroupedNotification(userId, documentId, `đã chuyển tiếp công văn cho bạn: ${document.summary || document.title}`, name, 'đã chuyển tiếp công văn cho bạn')
      }
    }

    revalidatePath(`/documents/incoming/${documentId}`)
    revalidatePath('/documents/incoming')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Lỗi khi chuyển tiếp' }
  }
}

export async function approveDocument(documentId: string, recipientId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const supabaseAdmin = await getSupabaseAdmin()

  // Update recipient status
  await supabaseAdmin
    .from('document_recipients')
    .update({ processing_status: 'Hoàn thành' })
    .match({ document_id: documentId, user_id: recipientId })

  // Add timeline event
  const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', recipientId).single()
  const recipientName = profile?.full_name || 'người nhận'

  await supabaseAdmin
    .from('document_comments')
    .insert({
      document_id: documentId,
      user_id: userData.user.id,
      content: `Đã duyệt báo cáo của ${recipientName}`,
      action_type: 'approve'
    })

  // Notification
  const { data: document } = await supabaseAdmin.from('documents').select('title, summary').eq('id', documentId).single()
  if (document) {
    const { data: currentProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = currentProfile?.full_name || 'Người giao'
    await createGroupedNotification(recipientId, documentId, `đã duyệt báo cáo công văn: ${document.summary || document.title}`, name, 'đã duyệt báo cáo công văn')
  }

  // Check if all recipients are done
  const { data: allRecipients } = await supabaseAdmin.from('document_recipients').select('processing_status').eq('document_id', documentId)
  if (allRecipients && allRecipients.length > 0) {
    const allDone = allRecipients.every(r => r.processing_status === 'Hoàn thành' || r.processing_status === 'Đã chuyển tiếp')
    if (allDone) {
      await supabaseAdmin.from('documents').update({ status: 'Hoàn thành' }).eq('id', documentId)
    }
  }

  revalidatePath(`/documents/incoming/${documentId}`)
  revalidatePath(`/documents/sent/${documentId}`)
  revalidatePath('/documents/incoming')
  revalidatePath('/documents/sent')
  return { success: true }
}

export async function rejectDocument(documentId: string, recipientId: string, reason: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const supabaseAdmin = await getSupabaseAdmin()

  // Update recipient status
  await supabaseAdmin
    .from('document_recipients')
    .update({ processing_status: 'Đang thực hiện' })
    .match({ document_id: documentId, user_id: recipientId })

  // Add timeline event
  const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', recipientId).single()
  const recipientName = profile?.full_name || 'người nhận'

  await supabaseAdmin
    .from('document_comments')
    .insert({
      document_id: documentId,
      user_id: userData.user.id,
      content: `Đã từ chối báo cáo của ${recipientName}. Lý do: ${reason}`,
      action_type: 'reject'
    })

  // Notification
  const { data: document } = await supabaseAdmin.from('documents').select('title, summary').eq('id', documentId).single()
  if (document) {
    const { data: currentProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = currentProfile?.full_name || 'Người giao'
    await createGroupedNotification(recipientId, documentId, `đã từ chối báo cáo công văn: ${document.summary || document.title}`, name, 'đã từ chối báo cáo công văn')
  }

  revalidatePath(`/documents/incoming/${documentId}`)
  revalidatePath(`/documents/sent/${documentId}`)
  revalidatePath('/documents/incoming')
  revalidatePath('/documents/sent')
  return { success: true }
}

export async function addDocumentComment(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const documentId = formData.get('documentId') as string
  const content = formData.get('content') as string
  const files = formData.getAll('attachments') as File[]

  const supabaseAdmin = await getSupabaseAdmin()

  const uploadedAttachments = []
  for (const file of files) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `documents/comments/${documentId}/${fileName}`

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
          size: file.size,
          type: file.type
        })
      }
    }
  }

  // Add timeline event
  await supabaseAdmin
    .from('document_comments')
    .insert({
      document_id: documentId,
      user_id: userData.user.id,
      content: content,
      action_type: 'comment',
      files: uploadedAttachments.length > 0 ? uploadedAttachments : null
    })

  // Notification cho tất cả người liên quan
  const { data: document } = await supabaseAdmin.from('documents').select('created_by, title, summary').eq('id', documentId).single()
  const { data: recipients } = await supabaseAdmin.from('document_recipients').select('user_id').eq('document_id', documentId)
  
  if (document && recipients) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = profile?.full_name || 'Một người dùng'
    
    const allUsersToNotify = new Set(recipients.map(r => r.user_id))
    allUsersToNotify.add(document.created_by)
    allUsersToNotify.delete(userData.user.id)
    
    for (const userId of allUsersToNotify) {
      await createGroupedNotification(userId, documentId, `đã bình luận vào công văn: ${document.summary || document.title}`, name, 'đã bình luận vào công văn')
    }
  }

  revalidatePath(`/documents/incoming/${documentId}`)
  revalidatePath(`/documents/sent/${documentId}`)
  return { success: true }
}

export async function getForwardableUsersForDocument(documentId: string, currentUserId: string) {
  const supabaseAdmin = await getSupabaseAdmin()
  
  // Get all users
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, department, avatar_url, role')
    .neq('id', currentUserId)
    
  // Get users who are already in the recipients chain
  const { data: existingRecipients } = await supabaseAdmin
    .from('document_recipients')
    .select('user_id')
    .eq('document_id', documentId)
    
  const existingUserIds = existingRecipients?.map(r => r.user_id) || []
  
  // Lọc ra những user chưa được giao/chuyển tiếp công việc này
  // (Cho phép chuyển tiếp nếu user đó chưa từng tham gia vào document này)
  const availableUsers = profiles?.filter(p => !existingUserIds.includes(p.id)) || []
  
  return availableUsers
}

export async function getDocumentDetails(documentId: string) {
  const supabaseAdmin = await getSupabaseAdmin()
  const { data: document } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()
  return document
}
