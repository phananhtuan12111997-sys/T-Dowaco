'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNotifications(offset: number = 0, limit: number = 5) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  return data
}

export async function getUnreadCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }
  return count || 0
}

export async function markAsRead(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (!error) {
    return { success: true }
  }
  return { success: false }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (!error) {
    return { success: true }
  }
  return { success: false }
}

export async function createNotification(userId: string, message: string, documentId: string) {
  // Use service role to bypass RLS when creating notifications from server actions
  const supabaseAdmin = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      message,
      document_id: documentId,
      is_read: false
    })
    
  return { error }
}

export async function createGroupedNotification(
  userId: string,
  documentId: string,
  baseMessage: string,
  actorName: string,
  typeKeyword: string
) {
  const supabaseAdmin = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existing } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('document_id', documentId)
    .eq('is_read', false)
    .ilike('message', `%${typeKeyword}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    if (existing.message.includes(actorName)) {
      await supabaseAdmin.from('notifications').update({
        is_read: false,
        created_at: new Date().toISOString()
      }).eq('id', existing.id)
      return { error: null }
    }

    let newCount = 1
    const match = existing.message.match(/và (\d+) người khác/)
    if (match) {
      newCount = parseInt(match[1], 10) + 1
    }

    const newMessage = `${actorName} và ${newCount} người khác ${baseMessage}`
    const { error } = await supabaseAdmin.from('notifications').update({
      message: newMessage,
      is_read: false,
      created_at: new Date().toISOString()
    }).eq('id', existing.id)
    return { error }
  } else {
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      message: `${actorName} ${baseMessage}`,
      document_id: documentId,
      is_read: false
    })
    return { error }
  }
}
