import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreateUserButton } from './create-user-button'
import { UserActions } from './user-actions'
import { HrFilters } from './hr-filters'
import { HrPagination } from './hr-pagination'
import { HrUserRow } from './hr-user-row'
import { User } from 'lucide-react'
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function HRPage(props: any) {
  const searchParams = await props.searchParams || {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Double check admin or HR
  const { data: profile } = await supabase.from('profiles').select('is_admin, department').eq('id', user.id).single()
  const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch')
  
  if (!profile?.is_admin && !isHR) {
    redirect('/')
  }

  // Parse filters
  const page = Number(searchParams.page) || 1
  const pageSize = 10
  const q = searchParams.q || ''
  const department = searchParams.department || 'all'

  // Fetch users list
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
  }
  
  if (department && department !== 'all') {
    query = query.eq('department', department)
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data: users, count, error } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Quản lý Nhân sự</h1>
          <p className="text-slate-500">Quản lý tài khoản, phòng ban và chức vụ của nhân viên</p>
        </div>
        <CreateUserButton />
      </div>
      
      <HrFilters />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500">Lỗi tải danh sách người dùng.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>Phòng ban</TableHead>
                    <TableHead>Chức vụ</TableHead>
                    <TableHead>Thông tin liên hệ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right w-[100px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <HrUserRow key={u.id} user={u} />
                  ))}
                  {(!users || users.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-32 text-slate-500">
                        Không tìm thấy nhân viên nào phù hợp.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <HrPagination 
              totalItems={count || 0}
              currentPage={page}
              pageSize={pageSize}
            />
          </>
        )}
      </div>
    </div>
  )
}
