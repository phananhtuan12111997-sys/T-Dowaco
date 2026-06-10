import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TasksSearch } from '../tasks-search'
import { TaskRow } from '@/components/task-row'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export default async function IncomingTasksPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null

  // Fetch current user profile to check role
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  const isStaffOnly = currentUserProfile?.role === 'Nhân viên'

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
      created_by,
      task_recipients!inner(
        user_id,
        processing_status,
        status
      )
    `)
    .eq('task_recipients.user_id', userData.user.id)

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data: tasksData } = await query.order('created_at', { ascending: false })
    
  const senderIds = Array.from(new Set(tasksData?.map(t => t.created_by).filter(Boolean) as string[]))
  let profiles: any[] = []
  if (senderIds.length > 0) {
    const { data: pData } = await supabase.from('profiles').select('id, full_name').in('id', senderIds)
    profiles = pData || []
  }
  const profilesMap = new Map(profiles.map(p => [p.id, p.full_name]))

  const tasks = tasksData?.map(task => ({
    ...task,
    assigner_name: task.created_by ? (profilesMap.get(task.created_by) || 'Không rõ') : 'Không rõ',
    processing_status: task.task_recipients[0]?.processing_status || 'Chưa xử lý',
    read_status: task.task_recipients[0]?.status || 'Chưa xem'
  }))

  return (
    <div className="space-y-6">
      <RealtimeRefresh tables={['tasks', 'task_recipients', 'task_comments']} />
      <div className="flex justify-end mb-4">
        {!isStaffOnly && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/tasks/create">
              <Plus className="w-4 h-4 mr-2" /> Giao việc mới
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-slate-200 gap-4">
          <h2 className="text-lg font-semibold text-[#1a56db]">Công việc đã nhận</h2>
          <div className="flex w-full md:w-auto">
            <TasksSearch />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên công việc</th>
                <th className="px-6 py-4 font-semibold">Người giao</th>
                <th className="px-6 py-4 font-semibold">Độ ưu tiên</th>
                <th className="px-6 py-4 font-semibold">Thời hạn</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái xử lý</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskRow key={task.id} task={task} isSent={false} showActions={true} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Calendar className="w-8 h-8 text-slate-300" />
                      <p>Bạn chưa có công việc nào cần thực hiện</p>
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
