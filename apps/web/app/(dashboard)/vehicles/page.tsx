import { createClient } from '@/utils/supabase/server'
import { VehicleTable } from './vehicle-table'
import { VehicleFilters } from './vehicle-filters'
import { VehiclePagination } from './vehicle-pagination'
import { VehicleRealtime } from './vehicle-realtime'
import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function VehiclesPage(props: any) {
  const searchParams = await props.searchParams || {}
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user?.id).single()
  
  const isBanDieuHanh = profile?.department === 'Ban điều hành'
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin
  const isHR = profile?.department === 'Phòng tổ chức Hành chánh'

  // Extract search params
  const q = typeof searchParams.q === 'string' ? searchParams.q : ''
  const status = typeof searchParams.status === 'string' ? searchParams.status : 'all'
  const page = searchParams.page ? parseInt(searchParams.page as string) : 1
  const limit = 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('vehicle_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Phân quyền
  if (!isITAdmin && !isHR) {
    if (isBanDieuHanh) {
      query = query.or(`created_by.eq.${user?.id},approver_id.eq.${user?.id},companions.cs.["${user?.id}"]`)
    } else {
      query = query.or(`created_by.eq.${user?.id},companions.cs.["${user?.id}"]`)
    }
  }

  // Bộ lọc
  if (status !== 'all') {
    query = query.eq('status', status)
  }
  
  if (q) {
    query = query.or(`requester_name.ilike.%${q}%,trip_purpose.ilike.%${q}%`)
  }

  // Phân trang
  query = query.range(from, to)

  const { data: requests, count } = await query
  const totalCount = count || 0

  // Lấy map user để hiển thị tên thay vì ID
  const { data: usersData } = await supabase.from('profiles').select('id, full_name, department')
  const usersMap = (usersData || []).reduce((acc: any, curr: any) => {
    acc[curr.id] = curr
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <VehicleRealtime />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/vehicles" className="hover:text-blue-600 transition-colors">LKWA</Link>
            <span>→</span>
            <span>Quản lý xin xe</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Hệ thống Đăng ký Xe</h1>
        </div>
        
        {!isBanDieuHanh && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full md:w-auto">
            <Link href="/vehicles/create">
              <Plus className="mr-2 h-4 w-4" /> Đăng ký xe mới
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col p-4 gap-4">
        <VehicleFilters />
        
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>}>
          <VehicleTable 
            requests={requests || []} 
            isBanDieuHanh={isBanDieuHanh} 
            isITAdmin={isITAdmin}
            isHR={isHR}
            currentUserId={user?.id} 
            usersMap={usersMap} 
          />
        </Suspense>

        <VehiclePagination totalCount={totalCount} limit={limit} />
      </div>
    </div>
  )
}
