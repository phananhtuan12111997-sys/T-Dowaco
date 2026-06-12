import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Calendar, Inbox, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SentTasksFilters } from './sent-tasks-filters'
import { TaskRow } from '@/components/task-row'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { deleteTask } from '../actions'

export default async function SentTasksPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const priority = typeof searchParams.priority === 'string' ? searchParams.priority : 'all'
  const recipient = typeof searchParams.recipient === 'string' ? searchParams.recipient : 'all'
  const fromDate = typeof searchParams.from === 'string' ? searchParams.from : ''
  const toDate = typeof searchParams.to === 'string' ? searchParams.to : ''
  const statusTab = typeof searchParams.status === 'string' ? searchParams.status : 'all'

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null

  // Fetch current user profile to check role
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', userData.user.id)
    .single()

  const isStaffOnly = ['Nhân viên', 'Thủ quỹ', 'Thủ kho', 'Lái xe'].includes(currentUserProfile?.role)
  const isAdmin = currentUserProfile?.is_admin

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabaseAdmin
    .from('tasks')
    .select(`
      id,
      title,
      description,
      priority,
      due_date,
      status,
      created_at,
      task_recipients(
        user_id,
        processing_status,
        status
      )
    `)

  if (!isAdmin) {
    query = query.eq('created_by', userData.user.id)
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  if (priority && priority !== 'all') {
    query = query.eq('priority', priority)
  }

  if (recipient && recipient !== 'all') {
    query = query.eq('task_recipients.user_id', recipient)
  }

  if (fromDate) {
    query = query.gte('due_date', fromDate)
  }
  
  if (toDate) {
    query = query.lte('due_date', toDate)
  }


  const { data: tasksData } = await query.order('created_at', { ascending: false })
    
  // Fetch profiles for all recipients
  const recipientIds = new Set<string>()
  tasksData?.forEach(task => {
    task.task_recipients?.forEach((r: any) => recipientIds.add(r.user_id))
  })
  
  let profiles: any[] = []
  if (recipientIds.size > 0) {
    const { data: pData } = await supabase.from('profiles').select('id, full_name').in('id', Array.from(recipientIds))
    profiles = pData || []
  }
  const profilesMap = new Map(profiles.map(p => [p.id, p.full_name]))

  // Fetch all users for the recipient filter
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  let tasks = tasksData?.map(task => {
    const recipients = task.task_recipients || []
    const recipientNames = recipients.map((r: any) => profilesMap.get(r.user_id)).filter(Boolean)
    const displayRecipients = recipientNames.length > 2 
      ? `${recipientNames.slice(0, 2).join(', ')} và ${recipientNames.length - 2} người khác`
      : recipientNames.join(', ')

    // Tính trạng thái chung
    const allCompleted = recipients.length > 0 && recipients.every((r: any) => r.processing_status === 'Hoàn thành' || r.processing_status === 'Đã hoàn thành')
    const anyWaiting = recipients.some((r: any) => r.processing_status === 'Chờ duyệt' || r.processing_status === 'Đã gửi báo cáo')
    const anyInProgress = recipients.some((r: any) => r.processing_status === 'Đang thực hiện')
    const overallStatus = allCompleted ? 'Hoàn thành' : (anyWaiting ? 'Chờ duyệt' : (anyInProgress ? 'Đang thực hiện' : 'Chưa xử lý'))

    return {
      ...task,
      assignee_name: displayRecipients || 'Không có người nhận',
      processing_status: overallStatus,
      overall_status: overallStatus
    }
  })

  if (statusTab === 'completed') {
    tasks = tasks?.filter(t => t.overall_status === 'Hoàn thành')
  } else if (statusTab === 'processing') {
    tasks = tasks?.filter(t => t.overall_status === 'Đang thực hiện')
  }


  return (
    <div className="space-y-6">
      <RealtimeRefresh tables={['tasks', 'task_recipients', 'task_comments']} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Công việc đã giao</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Danh sách Công việc đã giao</h1>
        </div>
        
        {!isStaffOnly && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
            <Link href="/tasks/create">
              <Plus className="mr-2 h-4 w-4" /> Giao việc mới
            </Link>
          </Button>
        )}
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        <Button variant={statusTab === 'all' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm">
          <Link href={`/tasks/sent?status=all&priority=${priority}&recipient=${recipient}&q=${q}`}>
            <Inbox className="w-4 h-4 mr-2" />
            Tất cả
          </Link>
        </Button>
        <Button variant={statusTab === 'processing' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm text-orange-600 border-orange-200 hover:bg-orange-50">
          <Link href={`/tasks/sent?status=processing&priority=${priority}&recipient=${recipient}&q=${q}`}>
            <Clock className="w-4 h-4 mr-2" />
            Đang thực hiện
          </Link>
        </Button>
        <Button variant={statusTab === 'completed' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm text-green-600 border-green-200 hover:bg-green-50">
          <Link href={`/tasks/sent?status=completed&priority=${priority}&recipient=${recipient}&q=${q}`}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Hoàn thành
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
          <SentTasksFilters users={allUsers || []} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên công việc</th>
                <th className="px-6 py-4 font-semibold">Trích yếu</th>
                <th className="px-6 py-4 font-semibold">Người nhận</th>
                <th className="px-6 py-4 font-semibold">Độ ưu tiên</th>
                <th className="px-6 py-4 font-semibold">Thời hạn</th>
                <th className="px-6 py-4 font-semibold text-center">Tiến độ chung</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskRow 
                    key={task.id} 
                    task={task} 
                    isSent={true} 
                    showActions={true}
                    onDelete={deleteTask}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Calendar className="w-8 h-8 text-slate-300" />
                      <p>Bạn chưa giao công việc nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
