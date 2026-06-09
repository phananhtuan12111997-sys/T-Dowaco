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
