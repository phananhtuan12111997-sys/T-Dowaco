'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
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

export function CreateUserButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhân sự
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản nhân viên</DialogTitle>
          <DialogDescription>
            Điền các thông tin cần thiết. Nhân viên sẽ bị yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded">{error}</div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tài khoản (Bắt buộc)</Label>
              <Input id="username" name="username" required placeholder="VD: nguyenvana" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu khởi tạo (Bắt buộc)</Label>
              <Input id="password" name="password" required type="password" placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên (Bắt buộc)</Label>
              <Input id="full_name" name="full_name" required placeholder="VD: Nguyễn Văn A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select name="gender">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Phòng ban (Bắt buộc)</Label>
              <Select name="department" required>
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
              <Select name="role" required>
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" name="phone" placeholder="Tùy chọn" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email liên hệ</Label>
              <Input id="email" name="email" type="email" placeholder="Tùy chọn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" name="address" placeholder="Tùy chọn" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Ảnh đại diện</Label>
            <Input id="avatar" name="avatar" type="file" accept="image/*" />
            <p className="text-xs text-slate-500">Tùy chọn. File ảnh nên có kích thước nhỏ hơn 3MB.</p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
