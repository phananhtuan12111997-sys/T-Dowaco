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

export async function acceptTask(taskId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const supabaseAdmin = await getSupabaseAdmin()

  // Update recipient status
  await supabaseAdmin
    .from('task_recipients')
    .update({ processing_status: 'Đang thực hiện', status: 'Đã xem' })
    .match({ task_id: taskId, user_id: userData.user.id })

  // Add timeline event
  await supabaseAdmin
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userData.user.id,
      content: 'Đã tiếp nhận công việc',
      type: 'accept'
    })

  // Notification
  const { data: task } = await supabaseAdmin.from('tasks').select('created_by, title').eq('id', taskId).single()
  const { data: recipient } = await supabaseAdmin.from('task_recipients').select('forwarded_from').match({ task_id: taskId, user_id: userData.user.id }).single()
  
  if (task) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = profile?.full_name || 'Một người dùng'
    
    await createGroupedNotification(task.created_by, taskId, `đã cập nhật trạng thái công việc: ${task.title}`, name, 'cập nhật trạng thái công việc')
    
    if (recipient?.forwarded_from && recipient.forwarded_from !== task.created_by) {
      await createGroupedNotification(recipient.forwarded_from, taskId, `đã cập nhật trạng thái công việc được chuyển tiếp: ${task.title}`, name, 'cập nhật trạng thái công việc')
    }
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

export async function reportTask(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const taskId = formData.get('taskId') as string
  const content = formData.get('content') as string
  const files = formData.getAll('attachments') as File[]

  const supabaseAdmin = await getSupabaseAdmin()

  const uploadedAttachments = []
  for (const file of files) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `tasks/reports/${userData.user.id}/${fileName}`

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

  let finalContent = content;
  if (uploadedAttachments.length > 0) {
    finalContent += `\n:::ATTACHMENTS:::${JSON.stringify(uploadedAttachments)}`;
  }

  // Update recipient status
  const { error: updateError } = await supabaseAdmin
    .from('task_recipients')
    .update({ processing_status: 'Chờ duyệt' })
    .match({ task_id: taskId, user_id: userData.user.id })
    
  if (updateError) {
    console.error("Lỗi khi cập nhật trạng thái (thường do constraint trong DB):", updateError)
    // Không throw error ở đây để phần bình luận vẫn được lưu thành công
  }

  // Add report comment
  await supabaseAdmin
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userData.user.id,
      content: finalContent,
      type: 'report'
    })

  // Notification
  const { data: task } = await supabaseAdmin.from('tasks').select('created_by, title').eq('id', taskId).single()
  const { data: recipient } = await supabaseAdmin.from('task_recipients').select('forwarded_from').match({ task_id: taskId, user_id: userData.user.id }).single()
  
  if (task) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = profile?.full_name || 'Một người dùng'
    
    await createGroupedNotification(task.created_by, taskId, `đã cập nhật trạng thái công việc: ${task.title}`, name, 'cập nhật trạng thái công việc')
    
    if (recipient?.forwarded_from && recipient.forwarded_from !== task.created_by) {
      await createGroupedNotification(recipient.forwarded_from, taskId, `đã cập nhật trạng thái công việc được chuyển tiếp: ${task.title}`, name, 'cập nhật trạng thái công việc')
    }
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

export async function forwardTask(taskId: string, targetUserIds: string[], note: string = '') {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const supabaseAdmin = await getSupabaseAdmin()

  // Find users
  const { data: targetUsers } = await supabaseAdmin.from('profiles').select('id, full_name').in('id', targetUserIds)

  // Insert recipients
  const recipients = targetUserIds.map(id => ({
    task_id: taskId,
    user_id: id,
    status: 'Chưa xem',
    processing_status: 'Chưa xử lý',
    forwarded_from: userData.user.id
  }))

  await supabaseAdmin.from('task_recipients').insert(recipients)

  // Update forwarder status
  await supabaseAdmin
    .from('task_recipients')
    .update({ processing_status: 'Đã chuyển tiếp' })
    .match({ task_id: taskId, user_id: userData.user.id })

  // Add timeline event
  const names = targetUsers?.map(u => u.full_name).join(', ')
  const content = note ? `Đã chuyển tiếp cho ${names}. Lời nhắn: ${note}` : `Đã chuyển tiếp cho ${names}`
  
  await supabaseAdmin
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userData.user.id,
      content: content,
      type: 'forward'
    })

  // Notification
  const { data: task } = await supabaseAdmin.from('tasks').select('title').eq('id', taskId).single()
  if (task) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = profile?.full_name || 'Một người dùng'
    for (const targetId of targetUserIds) {
      await createGroupedNotification(targetId, taskId, `đã chuyển tiếp công việc cho bạn: ${task.title}`, name, 'đã chuyển tiếp công việc cho bạn')
    }
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

export async function approveTask(taskId: string, targetUserId: string, targetUserName: string, content: string = '') {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const supabaseAdmin = await getSupabaseAdmin()

  // Update target's status
  await supabaseAdmin
    .from('task_recipients')
    .update({ processing_status: 'Hoàn thành' })
    .match({ task_id: taskId, user_id: targetUserId })

  // Add timeline event
  const commentContent = content ? `Đã duyệt báo cáo của ${targetUserName}: ${content}` : `Đã duyệt báo cáo của ${targetUserName}`
  
  await supabaseAdmin
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userData.user.id,
      content: commentContent,
      type: 'approve'
    })

  // Notification
  const { data: task } = await supabaseAdmin.from('tasks').select('title, status').eq('id', taskId).single()
  if (task) {
    const { data: currentProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = currentProfile?.full_name || 'Người giao'
    await createGroupedNotification(targetUserId, taskId, `đã cập nhật trạng thái công việc: ${task.title}`, name, 'cập nhật trạng thái công việc')
  }

  // Check if all recipients have completed
  const { data: allRecipients } = await supabaseAdmin
    .from('task_recipients')
    .select('processing_status')
    .eq('task_id', taskId)

  if (allRecipients && allRecipients.length > 0) {
    const allCompleted = allRecipients.every(r => r.processing_status === 'Hoàn thành')
    if (allCompleted && task?.status !== 'Hoàn thành') {
      await supabaseAdmin
        .from('tasks')
        .update({ status: 'Hoàn thành' })
        .eq('id', taskId)
    }
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

export async function rejectTask(taskId: string, targetUserId: string, targetUserName: string, reason: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const supabaseAdmin = await getSupabaseAdmin()

  // Update target's status back to 'Đang thực hiện'
  await supabaseAdmin
    .from('task_recipients')
    .update({ processing_status: 'Đang thực hiện' })
    .match({ task_id: taskId, user_id: targetUserId })

  // Add timeline event
  await supabaseAdmin
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userData.user.id,
      content: `Đã trả về báo cáo của ${targetUserName}. Lý do: ${reason}`,
      type: 'reject'
    })

  // Notification
  const { data: task } = await supabaseAdmin.from('tasks').select('title').eq('id', taskId).single()
  if (task) {
    const { data: currentProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = currentProfile?.full_name || 'Người giao'
    await createGroupedNotification(targetUserId, taskId, `đã cập nhật trạng thái công việc: ${task.title}`, name, 'cập nhật trạng thái công việc')
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

export async function addComment(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  const taskId = formData.get('taskId') as string
  const content = formData.get('content') as string
  const files = formData.getAll('attachments') as File[]

  const supabaseAdmin = await getSupabaseAdmin()

  const uploadedAttachments = []
  for (const file of files) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `tasks/comments/${userData.user.id}/${fileName}`

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

  let finalContent = content;
  if (uploadedAttachments.length > 0) {
    finalContent += `\n:::ATTACHMENTS:::${JSON.stringify(uploadedAttachments)}`;
  }

  await supabaseAdmin
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userData.user.id,
      content: finalContent,
      type: 'comment'
    })

  // Notification
  const { data: task } = await supabaseAdmin.from('tasks').select('created_by, title').eq('id', taskId).single()
  const { data: recipients } = await supabaseAdmin.from('task_recipients').select('user_id').eq('task_id', taskId)
  if (task) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
    const name = profile?.full_name || 'Một người dùng'
    
    const notifyIds = new Set<string>()
    if (task.created_by !== userData.user.id) notifyIds.add(task.created_by)
    if (recipients) {
      recipients.forEach(r => {
        if (r.user_id !== userData.user.id) notifyIds.add(r.user_id)
      })
    }
    
    for (const notifyId of notifyIds) {
      await createGroupedNotification(notifyId, taskId, `vừa bình luận trong công việc: ${task.title}`, name, 'vừa bình luận trong công việc')
    }
  }

  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

export async function getForwardableUsers() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return []

  // Get current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, department')
    .eq('id', userData.user.id)
    .single()
    
  if (!profile) return []

  let query = supabase.from('profiles').select('id, full_name, role, department')

  if (profile.role === 'Giám đốc') {
    // Can forward to everyone
  } else if (profile.role === 'Phó giám đốc') {
    // Can forward to everyone except Giám đốc
    query = query.neq('role', 'Giám đốc')
  } else if (profile.role === 'Nhân viên') {
    return [] // Cannot forward
  } else {
    // Trưởng phòng, Phó phòng, Đội trưởng, Phó đội trưởng...
    query = query.eq('department', profile.department)
    
    if (profile.role.toLowerCase().includes('phó')) {
      // Phó phòng cannot forward to Trưởng phòng
      query = query.not('role', 'ilike', 'Trưởng%')
      query = query.not('role', 'ilike', 'Quản đốc%')
      query = query.not('role', 'ilike', 'Đội trưởng%')
    }
  }

  const { data: users } = await query.order('full_name', { ascending: true })
  
  // Exclude current user
  return (users || []).filter(u => u.id !== userData.user.id)
}
