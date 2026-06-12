import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Search, Star, Inbox, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IncomingFilters } from './incoming-filters'
import { IncomingPagination } from './incoming-pagination'
import { IncomingTable } from './incoming-table'
import { RealtimeListSubscriber } from '@/components/realtime-list-subscriber'
import { getUsers } from '../create/actions'

export default async function IncomingDocumentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const type = typeof searchParams.type === 'string' ? searchParams.type : 'all'
  const urgency = typeof searchParams.urgency === 'string' ? searchParams.urgency : 'all'
  const status = typeof searchParams.status === 'string' ? searchParams.status : 'all'
  const senderId = typeof searchParams.sender === 'string' ? searchParams.sender : 'all'
  const fromDate = typeof searchParams.from === 'string' ? searchParams.from : ''
  const toDate = typeof searchParams.to === 'string' ? searchParams.to : ''
  const pageStr = typeof searchParams.page === 'string' ? searchParams.page : '1'
  const page = parseInt(pageStr, 10) || 1
  const limit = 10
  const offset = (page - 1) * limit
  
  const { data: userData } = await supabase.auth.getUser()
  const users = await getUsers()

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabaseAdmin
    .from('documents')
    .select(`
      id,
      title,
      summary,
      priority,
      symbol_number,
      type,
      created_at,
      created_by,
      document_recipients!inner(
        user_id,
        processing_status,
        status
      )
    `, { count: 'exact' })
    .eq('document_recipients.user_id', userData.user?.id)

  if (type !== 'all') {
    query = query.eq('type', type)
  }

  if (urgency !== 'all') {
    if (urgency === 'high') {
      query = query.eq('priority', true)
    } else if (urgency === 'normal') {
      query = query.eq('priority', false)
    }
  }

  if (status !== 'all') {
    if (status === 'unread') {
      query = query.eq('document_recipients.status', 'Chưa xem')
    } else if (status === 'processing') {
      // Đã tiếp nhận -> Đang thực hiện
      query = query.eq('document_recipients.processing_status', 'Đang thực hiện')
    }
  }

  if (senderId !== 'all') {
    query = query.eq('created_by', senderId)
  }

  if (fromDate) {
    query = query.gte('created_at', `${fromDate}T00:00:00.000Z`)
  }

  if (toDate) {
    query = query.lte('created_at', `${toDate}T23:59:59.999Z`)
  }

  if (q) {
    query = query.or(`symbol_number.ilike.%${q}%,summary.ilike.%${q}%`)
  }

  const { data: documentsData, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    
  const senderIds = Array.from(new Set(documentsData?.map(d => d.created_by).filter(Boolean) as string[]))
  let profiles: any[] = []
  if (senderIds.length > 0) {
    const { data: pData } = await supabase.from('profiles').select('id, full_name').in('id', senderIds)
    profiles = pData || []
  }
  const profilesMap = new Map(profiles.map(p => [p.id, p.full_name]))

  const documents = documentsData?.map(doc => ({
    ...doc,
    sender_name: doc.created_by ? (profilesMap.get(doc.created_by) || 'Không rõ') : 'Không rõ',
    processing_status: doc.document_recipients[0]?.processing_status || 'Chưa xử lý',
    read_status: doc.document_recipients[0]?.status || 'Chưa xem'
  }))

  return (
    <div className="space-y-6">
      <RealtimeListSubscriber />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Công văn đến</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Danh sách Công văn đến</h1>
        </div>
        
        <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Link href="/cong-van/create">
            <Plus className="mr-2 h-4 w-4" /> Soạn công văn mới
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        <Button variant={status === 'all' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm">
          <Link href={`/cong-van/den?status=all&type=${type}&urgency=${urgency}&q=${q}`}>
            <Inbox className="w-4 h-4 mr-2" />
            Tất cả
          </Link>
        </Button>
        <Button variant={status === 'unread' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm text-amber-600 border-amber-200 hover:bg-amber-50">
          <Link href={`/cong-van/den?status=unread&type=${type}&urgency=${urgency}&q=${q}`}>
            <Clock className="w-4 h-4 mr-2" />
            Chưa xem
          </Link>
        </Button>
        <Button variant={status === 'processing' ? 'default' : 'outline'} asChild className="rounded-full shadow-sm text-blue-600 border-blue-200 hover:bg-blue-50">
          <Link href={`/cong-van/den?status=processing&type=${type}&urgency=${urgency}&q=${q}`}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Đã tiếp nhận
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
          <IncomingFilters users={users} />
        </div>

        <IncomingTable documents={documents || []} />
        
        <IncomingPagination totalCount={count || 0} limit={limit} />
      </div>
    </div>
  )
}
