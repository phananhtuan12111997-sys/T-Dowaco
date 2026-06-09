'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function getDocumentDetails(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Use service_role to bypass RLS issues
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: document, error } = await supabaseAdmin
    .from('documents')
    .select(`*`)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return null
  }
  
  // App-level security: allow if user is sender OR user is in recipients
  let hasAccess = document.created_by === user.id
  
  if (!hasAccess) {
    const { data: isRecipient } = await supabaseAdmin
      .from('document_recipients')
      .select('id')
      .eq('document_id', id)
      .eq('user_id', user.id)
      .single()
      
    if (isRecipient) hasAccess = true
  }
  
  if (!hasAccess) return null
  
  if (document && document.created_by) {
    const { data: sender } = await supabaseAdmin
      .from('profiles')
      .select('full_name, department')
      .eq('id', document.created_by)
      .single()
    document.sender = sender
  }

  return document
}

export async function getRecipients(id: string) {
  // Use service_role to bypass RLS issues
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: recipients, error } = await supabaseAdmin
    .from('document_recipients')
    .select(`
      id,
      status,
      processing_status,
      viewed_at,
      user_id,
      profile:profiles!document_recipients_user_id_fkey(
        id,
        full_name,
        department,
        avatar_url
      )
    `)
    .eq('document_id', id)

  if (error) {
    console.error('Error fetching recipients:', error)
    return []
  }

  return recipients
}

export async function markAsRead(documentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if already viewed
  const { data: existing } = await supabaseAdmin
    .from('document_recipients')
    .select('status')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .single()
    
  if (existing && existing.status !== 'Đã xem') {
    await supabaseAdmin
      .from('document_recipients')
      .update({ 
        status: 'Đã xem',
        viewed_at: new Date().toISOString()
      })
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      
    // Removed revalidatePath as it cannot be called during SSR render
  }
}

export async function submitReport(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const documentId = formData.get('document_id') as string
  const content = formData.get('content') as string
  const issues = formData.get('issues') as string
  const files = formData.getAll('attachments') as File[]
  const uploadedAttachments: { name: string; url: string; size: number }[] = []

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  for (const file of files) {
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        return { error: 'Một số file vượt quá dung lượng 10MB' }
      }
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `reports/${documentId}/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Lỗi upload file' }
      }

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

  const { error } = await supabaseAdmin
    .from('document_reports')
    .insert({
      document_id: documentId,
      user_id: user.id,
      content,
      issues,
      attachment_url: uploadedAttachments.length > 0 ? JSON.stringify(uploadedAttachments) : null,
      attachment_name: uploadedAttachments.length > 0 ? 'json' : null
    })

  if (error) {
    console.error('Submit report error:', error)
    return { error: `Lỗi CSDL: ${error.message}` }
  }

  await supabaseAdmin
    .from('document_recipients')
    .update({ processing_status: 'Đã trả lời/báo cáo' })
    .eq('document_id', documentId)
    .eq('user_id', user.id)

  // Fetch document details to get created_by and summary
  const { data: docData } = await supabaseAdmin
    .from('documents')
    .select('created_by, summary')
    .eq('id', documentId)
    .single()

  // Fetch user details for notification name
  const { data: userData } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (docData && docData.created_by && userData) {
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: docData.created_by,
        document_id: documentId,
        message: `${userData.full_name} đã trả lời/báo cáo công văn: ${docData.summary}`,
        is_read: false
      })
  }

  revalidatePath(`/documents/incoming/${documentId}`)
  return { success: true }
}

export async function forwardDocument(documentId: string, userIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!userIds || userIds.length === 0) return { error: 'Vui lòng chọn người nhận' }

  const inserts = userIds.map(id => ({
    document_id: documentId,
    user_id: id,
    status: 'Chưa xem'
  }))

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('document_recipients')
    .insert(inserts)

  if (error) {
    console.error('Forward error:', error)
    return { error: 'Có lỗi xảy ra khi chuyển tiếp' }
  }

  await supabaseAdmin
    .from('document_recipients')
    .update({ processing_status: 'Đã chuyển tiếp' })
    .eq('document_id', documentId)
    .eq('user_id', user.id)

  // Fetch document summary for notification
  const { data: docData } = await supabaseAdmin
    .from('documents')
    .select('summary')
    .eq('id', documentId)
    .single()

  if (docData) {
    const notificationsData = userIds.map(id => ({
      user_id: id,
      document_id: documentId,
      message: `Bạn vừa được chuyển tiếp công văn: ${docData.summary}`,
      is_read: false
    }))
    
    await supabaseAdmin
      .from('notifications')
      .insert(notificationsData)
  }

  revalidatePath(`/documents/incoming/${documentId}`)
  return { success: true }
}
