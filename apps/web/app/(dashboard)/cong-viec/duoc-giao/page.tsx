import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Calendar, Inbox, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IncomingTasksFilters } from './incoming-tasks-filters'
import { IncomingTasksTable } from './incoming-tasks-table'
import { TaskRow } from '@/components/task-row'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export default async function IncomingTasksPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const priority = typeof searchParams.priority === 'string' ? searchParams.priority : 'all'
  const sender = typeof searchParams.sender === 'string' ? searchParams.sender : 'all'
  const fromDate = typeof searchParams.from === 'string' ? searchParams.from : ''
  const toDate = typeof searchParams.to === 'string' ? searchParams.to : ''
  const statusTab = typeof searchParams.status === 'string' ? searchParams.status : 'all'

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null

  // Fetch current user profile to check role
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  const isStaffOnly = ['Nhân viên', 'Thủ quỹ', 'Thủ kho', 'Lái xe'].includes(currentUserProfile?.role)

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

  if (priority && priority !== 'all') {
    query = query.eq('priority', priority)
  }

  if (sender && sender !== 'all') {
    query = query.eq('created_by', sender)
  }

  if (fromDate) {
    query = query.gte('due_date', fromDate)
  }
  
  if (toDate) {
    query = query.lte('due_date', toDate)
  }

  if (statusTab === 'unread') {
    query = query.eq('task_recipients.status', 'Chưa xem')
  } else if (statusTab === 'processing') {
    query = query.eq('task_recipients.processing_status', 'Đang thực hiện')
  }


  const { data: tasksData } = await query.order('created_at', { ascending: false })
    
  const senderIds = Array.from(new Set(tasksData?.map(t => t.created_by).filter(Boolean) as string[]))
  let profiles: any[] = []
  if (senderIds.length > 0) {
    const { data: pData } = await supabase.from('profiles').select('id, full_name').in('id', senderIds)
    profiles = pData || []
  }
  const profilesMap = new Map(profiles.map(p => [p.id, p.full_name]))

  // Fetch all users for the sender filter
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')


  const tasks = tasksData?.map(task => ({
    ...task,
    assigner_name: task.created_by ? (profilesMap.get(task.created_by) || 'Không rõ') : 'Không rõ',
    processing_status: task.task_recipients[0]?.processing_status || 'Chưa xử lý',
    read_status: task.task_recipients[0]?.status || 'Chưa xem'
  }))

  return (
    <div className="space-y-6">
      <RealtimeRefresh tables={['tasks', 'task_recipients', 'task_comments']} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Công việc đã nhận</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Công việc đã nhận</h1>
        </div>
        
        {!isStaffOnly && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
            <Link href="/cong-viec/create">
              <Plus className="mr-2 h-4 w-4" /> Giao việc mới
            </Link>
          </Button>
        )}
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        <Button variant={statusTab === 'all' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm">
          <Link href={`/cong-viec/duoc-giao?status=all&priority=${priority}&sender=${sender}&q=${q}`}>
            <Inbox className="w-4 h-4 mr-2" />
            Tất cả
          </Link>
        </Button>
        <Button variant={statusTab === 'unread' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm text-amber-600 border-amber-200 hover:bg-amber-50">
          <Link href={`/cong-viec/duoc-giao?status=unread&priority=${priority}&sender=${sender}&q=${q}`}>
            <Clock className="w-4 h-4 mr-2" />
            Chưa xem
          </Link>
        </Button>
        <Button variant={statusTab === 'processing' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm text-blue-600 border-blue-200 hover:bg-blue-50">
          <Link href={`/cong-viec/duoc-giao?status=processing&priority=${priority}&sender=${sender}&q=${q}`}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Đang thực hiện
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
          <IncomingTasksFilters users={allUsers || []} />
        </div>

        <IncomingTasksTable tasks={tasks || []} />
      </div>
    </div>
  )
}
