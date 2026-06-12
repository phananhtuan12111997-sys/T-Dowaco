'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDocumentReport(documentId: string, userId: string) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin
    .from('document_reports')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return { error: 'Không tìm thấy báo cáo' }

  return { data }
}

export async function getForwardedRecipients(originalDocumentId: string, forwarderId: string) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: docData } = await supabaseAdmin
    .from('documents')
    .select('id')
    .eq('forwarded_from_id', originalDocumentId)
    .eq('created_by', forwarderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!docData) return { data: [] }

  const { data: recipients } = await supabaseAdmin
    .from('document_recipients')
    .select(`
      id,
      user_id,
      status,
      processing_status,
      viewed_at,
      profile:profiles!document_recipients_user_id_fkey(full_name, department, role)
    `)
    .eq('document_id', docData.id)

  return { data: recipients || [] }
}

export async function completeDocumentProcessing(documentId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('document_recipients')
    .update({ processing_status: 'Hoàn thành' })
    .eq('document_id', documentId)
    .eq('user_id', userId)

  if (error) return { error: 'Cập nhật trạng thái thất bại' }

  const { data: docData } = await supabaseAdmin.from('documents').select('summary').eq('id', documentId).single()
  const { data: senderData } = await supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single()

  if (docData && senderData) {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      document_id: documentId,
      message: `${senderData.full_name} đã xác nhận hoàn thành công văn: ${docData.summary}`,
      is_read: false
    })
  }

  revalidatePath('/cong-van/di')
  revalidatePath(`/cong-van/di/${documentId}`)
  return { success: true }
}
