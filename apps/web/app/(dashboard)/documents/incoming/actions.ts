'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markDocumentsAsRead(documentIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !documentIds.length) return { error: 'Yêu cầu không hợp lệ' }

  const { error } = await supabase
    .from('document_recipients')
    .update({ status: 'Đã xem' })
    .eq('user_id', user.id)
    .in('document_id', documentIds)
    .eq('status', 'Chưa xem')
    
  if (error) return { error: error.message }
  
  revalidatePath('/documents/incoming')
  return { success: true }
}

export async function acceptDocuments(documentIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !documentIds.length) return { error: 'Yêu cầu không hợp lệ' }

  // Update both status to Đã xem and processing_status to Đang thực hiện
  const { error } = await supabase
    .from('document_recipients')
    .update({ processing_status: 'Đang thực hiện', status: 'Đã xem' })
    .eq('user_id', user.id)
    .in('document_id', documentIds)
    .eq('processing_status', 'Chưa xử lý')
    
  if (error) return { error: error.message }
  
  revalidatePath('/documents/incoming')
  return { success: true }
}
