import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMeeting } from '../actions'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function CreateMeetingPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <span>DOFFICE</span>
        <span>→</span>
        <Link href="/meetings" className="hover:text-[#1a56db]">Quản lý lịch họp</Link>
        <span>→</span>
        <span>Đăng ký lịch họp</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-[#1a56db]">Đăng ký lịch họp mới</h2>
            <p className="text-sm text-slate-500 mt-1">Sắp xếp cuộc họp trên hệ thống chung của cơ quan</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-200">
            <ShieldAlert className="w-4 h-4" />
            Chỉ dành cho Ban Điều Hành
          </div>
        </div>
        
        <div className="p-6">
          {/* Thông báo mô phỏng phân quyền */}
          <div className="mb-6 p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-100 flex gap-2">
            <strong>Lưu ý nội bộ:</strong> Trong bản Demo, form này mở cho mọi tài khoản. Ở bản chính thức, nút "Đăng ký lịch họp" sẽ bị ẩn với nhân viên thông thường.
          </div>

          <form action={createMeeting} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-700 font-semibold">Tiêu đề cuộc họp <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Ví dụ: Họp giao ban đầu tháng" 
                required 
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room" className="text-slate-700 font-semibold">Phòng họp / Địa điểm</Label>
              <Input 
                id="room" 
                name="room" 
                placeholder="Ví dụ: Phòng họp Tầng 1" 
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-slate-700 font-semibold">Thời gian bắt đầu <span className="text-red-500">*</span></Label>
                <Input 
                  id="start_time" 
                  name="start_time" 
                  type="datetime-local"
                  required
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-slate-700 font-semibold">Thời gian kết thúc <span className="text-red-500">*</span></Label>
                <Input 
                  id="end_time" 
                  name="end_time" 
                  type="datetime-local"
                  required
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 font-semibold">Nội dung / Thành phần tham dự</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Ghi chú thêm về cuộc họp..."
                rows={4}
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 resize-none"
              />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" asChild className="border-slate-300 text-slate-700">
                <Link href="/meetings">Hủy bỏ</Link>
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
                Tạo lịch họp
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
