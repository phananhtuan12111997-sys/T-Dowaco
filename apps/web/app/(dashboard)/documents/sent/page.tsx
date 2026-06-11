import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Search, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IncomingFilters } from '../incoming/incoming-filters'
import { IncomingPagination } from '../incoming/incoming-pagination'
import { SentDocumentRow } from './sent-document-row'
import { RecipientListModal } from './recipient-list-modal'
import { StatusDetailsModal } from './status-details-modal'
import { RealtimeListSubscriber } from '@/components/realtime-list-subscriber'

export default async function SentDocumentsPage(props: {
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

  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', userData.user?.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin

  // Find IDs of docs created OR forwarded
  const { data: createdDocs } = await supabaseAdmin.from('documents').select('id').eq('created_by', userData.user?.id)
  const { data: forwardedRecipients } = await supabaseAdmin.from('document_recipients')
    .select('document_id')
    .eq('user_id', userData.user?.id)
    .eq('processing_status', 'Đã chuyển tiếp')

  const createdIds = createdDocs?.map(d => d.id) || []
  const forwardedIds = forwardedRecipients?.map(r => r.document_id) || []
  const allIds = Array.from(new Set([...createdIds, ...forwardedIds]))

  let documents: any[] = []
  let count = 0

  if (allIds.length > 0 || isITAdmin) {
    let query = supabaseAdmin
      .from('documents')
      .select(`
        *,
        document_recipients(
          id,
          status,
          processing_status,
          user_id,
          document_id,
          profiles (
            full_name,
            department,
            role,
            avatar_url
          )
        )
      `, { count: 'exact' })

    if (!isITAdmin) {
      query = query.in('id', allIds)
    }

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

    const { data: documentsData, count: fetchedCount } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      
    count = fetchedCount || 0
    
    documents = documentsData?.map(doc => {
      const totalRecipients = doc.document_recipients?.length || 0
      const readRecipients = doc.document_recipients?.filter((r: any) => r.status === 'Đã xem').length || 0
      
      return {
        ...doc,
        recipient_count: totalRecipients,
        read_count: readRecipients,
        statusText: 'Đã gửi'
      }
    }) || []
  }

  return (
    <div className="space-y-6">
      <RealtimeListSubscriber />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Công văn đã gửi</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Danh sách Công văn đã gửi</h1>
        </div>
        
        <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Link href="/documents/create">
            <Plus className="mr-2 h-4 w-4" /> Soạn công văn mới
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <h2 className="font-semibold text-[#1a56db]">Hộp thư đi</h2>
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
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Người nhận</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Ngày gửi</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <SentDocumentRow key={doc.id} doc={doc} currentUserId={userData.user?.id} isITAdmin={isITAdmin} />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    Chưa có công văn nào được gửi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <IncomingPagination totalCount={count} limit={limit} />
      </div>
    </div>
  )
}
