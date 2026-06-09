import { createClient } from '@/utils/supabase/server'
import { VehicleClient } from './vehicle-client'
import { Suspense } from 'react'

export default async function VehiclesPage(props: any) {
  const searchParams = await props.searchParams || {}
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user?.id).single()
  
  const isBanDieuHanh = profile?.department === 'Ban điều hành'
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin

  const page = searchParams.page ? parseInt(searchParams.page as string) : 1
  const limit = 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('vehicle_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (!isITAdmin) {
    if (isBanDieuHanh) {
      query = query.or(`created_by.eq.${user?.id},approver_id.eq.${user?.id},companions.cs.["${user?.id}"]`)
    } else {
      query = query.or(`created_by.eq.${user?.id},companions.cs.["${user?.id}"]`)
    }
  }

  const { data: requests, count } = await query
  const totalPages = Math.ceil((count || 0) / limit)
  const { data: usersData } = await supabase.from('profiles').select('id, full_name, department')
  
  const usersMap = (usersData || []).reduce((acc: any, curr: any) => {
    acc[curr.id] = curr
    return acc
  }, {})

  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <VehicleClient 
        requests={requests || []} 
        isBanDieuHanh={isBanDieuHanh} 
        isITAdmin={isITAdmin}
        currentUserId={user?.id} 
        usersMap={usersMap} 
        currentPage={page} 
        totalPages={totalPages} 
      />
    </Suspense>
  )
}

