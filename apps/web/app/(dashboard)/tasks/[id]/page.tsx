import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { TaskDetailClient } from './task-detail-client'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export default async function TaskDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const taskId = params.id
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null
  const currentUserId = userData.user.id

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', currentUserId)
    .single()
  
  const isAdmin = currentUserProfile?.is_admin

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch Task
  const { data: task } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) return notFound()

  // Fetch Recipients
  const { data: recipientsData } = await supabaseAdmin
    .from('task_recipients')
    .select('*')
    .eq('task_id', taskId)

  const recipients = recipientsData || []

  // Check access: Is current user the assigner, or a recipient?
  const isAssigner = task.created_by === currentUserId
  const isRecipient = recipients.some(r => r.user_id === currentUserId)
  // If not assigner and not recipient, maybe they forwarded it? (They would be in recipients list anyway if they forwarded it because they had to receive it first).
  if (!isAssigner && !isRecipient && !isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-slate-500">Bạn không có quyền xem công việc này.</p>
      </div>
    )
  }

  // Fetch Comments (Timeline)
  const { data: commentsData } = await supabaseAdmin
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  const comments = commentsData || []

  // Fetch Profiles for everyone involved
  const userIds = new Set<string>()
  if (task.created_by) userIds.add(task.created_by)
  recipients.forEach(r => {
    userIds.add(r.user_id)
    if (r.forwarded_from) userIds.add(r.forwarded_from)
  })
  comments.forEach(c => userIds.add(c.user_id))

  const { data: profilesData } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, department, avatar_url')
    .in('id', Array.from(userIds))

  const profilesMap = new Map((profilesData || []).map(p => [p.id, p]))

  // Enrich data
  const enrichedTask = {
    ...task,
    assigner_name: profilesMap.get(task.created_by)?.full_name || 'Không rõ',
    assigner_role: profilesMap.get(task.created_by)?.role,
  }

  const enrichedRecipients = recipients.map(r => ({
    ...r,
    user_name: profilesMap.get(r.user_id)?.full_name || 'Không rõ',
    user_role: profilesMap.get(r.user_id)?.role,
    user_department: profilesMap.get(r.user_id)?.department,
    forwarded_from_name: r.forwarded_from ? profilesMap.get(r.forwarded_from)?.full_name : null,
  }))

  const enrichedComments = comments.map(c => ({
    ...c,
    user_name: profilesMap.get(c.user_id)?.full_name || 'Không rõ',
    user_avatar: profilesMap.get(c.user_id)?.avatar_url,
  }))

  // Define current user access and status
  const currentUserRecipient = recipients.find(r => r.user_id === currentUserId)

  return (
    <>
      <RealtimeRefresh tables={['tasks', 'task_recipients', 'task_comments']} />
      <TaskDetailClient 
        task={enrichedTask}
        recipients={enrichedRecipients}
        comments={enrichedComments}
        currentUserId={currentUserId}
        isAssigner={isAssigner}
        currentUserRecipient={currentUserRecipient}
      />
    </>
  )
}
