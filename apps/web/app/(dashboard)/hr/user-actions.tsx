'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function UserActions({ user }: { user: any }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      setEditOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      setDeleteOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* EDIT MODAL */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài khoản: {user.username}</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin hoặc cấp lại mật khẩu cho nhân viên. Nếu để trống mật khẩu, mật khẩu cũ sẽ được giữ nguyên.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded">{error}</div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <Input id="password" name="password" type="password" placeholder="Bỏ trống nếu không đổi" autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Họ và tên (Bắt buộc)</Label>
                <Input id="full_name" name="full_name" required defaultValue={user.full_name} placeholder="VD: Nguyễn Văn A" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Giới tính</Label>
                <Select name="gender" defaultValue={user.gender || "Nam"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Phòng ban (Bắt buộc)</Label>
                <Select name="department" required defaultValue={user.department}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ban điều hành">Ban điều hành</SelectItem>
                    <SelectItem value="Phòng tổ chức Hành chánh">Phòng tổ chức Hành chánh</SelectItem>
                    <SelectItem value="Phòng Tài chính Kế toán">Phòng Tài chính Kế toán</SelectItem>
                    <SelectItem value="Phòng IT">Phòng IT</SelectItem>
                    <SelectItem value="Phòng Kế hoạch Kỹ thuật">Phòng Kế hoạch Kỹ thuật</SelectItem>
                    <SelectItem value="Phòng Kinh Doanh">Phòng Kinh Doanh</SelectItem>
                    <SelectItem value="Đội xây lắp - Chống thất thoát">Đội xây lắp - Chống thất thoát</SelectItem>
                    <SelectItem value="Phân xưởng sản xuất">Phân xưởng sản xuất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Chức vụ (Bắt buộc)</Label>
                <Select name="role" required defaultValue={user.role}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chức vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Giám đốc">Giám đốc</SelectItem>
                    <SelectItem value="Phó Giám đốc">Phó Giám đốc</SelectItem>
                    <SelectItem value="Kế toán trưởng">Kế toán trưởng</SelectItem>
                    <SelectItem value="Trưởng phòng">Trưởng phòng</SelectItem>
                    <SelectItem value="Phó phòng">Phó phòng</SelectItem>
                    <SelectItem value="Đội trưởng">Đội trưởng</SelectItem>
                    <SelectItem value="Đội phó">Đội phó</SelectItem>
                    <SelectItem value="Phó quản đốc">Phó quản đốc</SelectItem>
                    <SelectItem value="Quản đốc">Quản đốc</SelectItem>
                    <SelectItem value="Nhân viên">Nhân viên</SelectItem>
                    <SelectItem value="Admin Hệ thống">Admin Hệ thống</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" name="phone" defaultValue={user.phone || ''} placeholder="Tùy chọn" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email liên hệ</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email || ''} placeholder="Tùy chọn" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" name="address" defaultValue={user.address || ''} placeholder="Tùy chọn" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Ảnh đại diện (mới)</Label>
              <Input id="avatar" name="avatar" type="file" accept="image/*" />
              <p className="text-xs text-slate-500">Để trống nếu không muốn thay đổi ảnh hiện tại.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      {!user.is_admin && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Xác nhận xóa tài khoản
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa tài khoản <strong>{user.username}</strong> ({user.full_name}) không? Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan đến người dùng này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded mt-2">{error}</div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete() }} disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
