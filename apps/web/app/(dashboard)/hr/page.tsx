import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreateUserButton } from './create-user-button'
import { UserActions } from './user-actions'
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function HRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Double check admin
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  
  if (!profile?.is_admin) {
    redirect('/')
  }

  // Fetch users list
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân sự</h1>
          <p className="text-slate-500">Quản lý tài khoản, phòng ban và chức vụ của nhân viên</p>
        </div>
        <CreateUserButton />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500">Lỗi tải danh sách người dùng.</div>
        ) : (
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
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {u.phone && <div>{u.phone}</div>}
                      {u.email && <div className="text-slate-500">{u.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.is_admin ? (
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">Admin</Badge>
                    ) : u.force_password_change ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Chờ đổi mật khẩu</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Hoạt động</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions user={u} />
                  </TableCell>
                </TableRow>
              ))}
              {(!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-slate-500">
                    Chưa có nhân viên nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
