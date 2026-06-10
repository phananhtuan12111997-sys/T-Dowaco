import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IncomingFilters } from './incoming-filters'
import { IncomingPagination } from './incoming-pagination'
import { IncomingDocumentRow } from './incoming-document-row'
import { RealtimeListSubscriber } from '@/components/realtime-list-subscriber'

export default async function IncomingDocumentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const type = typeof searchParams.type === 'string' ? searchParams.type : 'all'
  const urgency = typeof searchParams.urgency === 'string' ? searchParams.urgency : 'all'
  const pageStr = typeof searchParams.page === 'string' ? searchParams.page : '1'
  const page = parseInt(pageStr, 10) || 1
  const limit = 10
  const offset = (page - 1) * limit
  
  const { data: userData } = await supabase.auth.getUser()

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
            <span>LKW</span>
            <span>→</span>
            <span>Công văn đến</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Danh sách Công văn đến</h1>
        </div>
        
        <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Link href="/documents/create">
            <Plus className="mr-2 h-4 w-4" /> Soạn công văn mới
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <h2 className="font-semibold text-[#1a56db]">Hộp thư đến</h2>
          <IncomingFilters />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Ưu tiên</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Số ký hiệu</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Trích yếu</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Loại văn bản</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Người gửi</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Ngày gửi</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <IncomingDocumentRow key={doc.id} doc={doc} />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    Chưa có công văn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <IncomingPagination totalCount={count || 0} limit={limit} />
      </div>
    </div>
  )
}
