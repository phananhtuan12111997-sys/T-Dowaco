'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markTasksAsRead(taskIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !taskIds.length) return { error: 'Unauthorized or no tasks selected' }

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('task_recipients')
    .update({ status: 'Đã xem' })
    .in('task_id', taskIds)
    .eq('user_id', user.id)
    .eq('status', 'Chưa xem')

  if (error) {
    console.error('Error marking tasks as read:', error)
    return { error: 'Failed to mark tasks as read' }
  }

  revalidatePath('/cong-viec/duoc-giao')
  return { success: true }
}

export async function acceptTasks(taskIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !taskIds.length) return { error: 'Unauthorized or no tasks selected' }

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('task_recipients')
    .update({ 
      processing_status: 'Đang thực hiện',
      status: 'Đã xem'
    })
    .in('task_id', taskIds)
    .eq('user_id', user.id)
    .eq('processing_status', 'Chưa xử lý')

  if (error) {
    console.error('Error accepting tasks:', error)
    return { error: 'Failed to accept tasks' }
  }

  revalidatePath('/cong-viec/duoc-giao')
  return { success: true }
}
