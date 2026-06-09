import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMeeting } from '../actions'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function CreateMeetingPage() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <Link href="/meetings" className="hover:text-[#1a56db] transition-colors">T-Dowaco</Link>
        <span>→</span>
        <Link href="/meetings" className="hover:text-[#1a56db]">Quản lý lịch họp</Link>
        <span>→</span>
        <span>Đăng ký lịch họp</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-[#1a56db]">Đăng ký lịch họp mới</h2>
            <p className="text-sm text-slate-500 mt-1">Sắp xếp cuộc họp trên hệ thống chung của cơ quan</p>
          </div>
        </div>
        
        <div className="p-4">
          <form action={createMeeting} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host" className="text-slate-700 font-semibold">Người chủ trì <span className="text-red-500">*</span></Label>
                <Input 
                  id="host" 
                  name="host" 
                  placeholder="Ví dụ: Giám đốc Nguyễn Văn A" 
                  required
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room" className="text-slate-700 font-semibold">Phòng họp / Địa điểm <span className="text-red-500">*</span></Label>
                <Input 
                  id="room" 
                  name="room" 
                  placeholder="Ví dụ: Phòng họp Tầng 1" 
                  required
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label className="text-slate-700 font-semibold">Thành phần tham dự (Phòng ban)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_all" name="departments" value="Tất cả" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_all" className="text-sm font-medium leading-none cursor-pointer">Tất cả phòng ban</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_bdh" name="departments" value="Ban điều hành" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_bdh" className="text-sm font-medium leading-none cursor-pointer">Ban điều hành</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_hc" name="departments" value="Phòng tổ chức Hành chánh" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_hc" className="text-sm font-medium leading-none cursor-pointer">Phòng tổ chức Hành chánh</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_kt" name="departments" value="Phòng Tài chính Kế toán" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_kt" className="text-sm font-medium leading-none cursor-pointer">Phòng Tài chính Kế toán</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_it" name="departments" value="Phòng IT" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_it" className="text-sm font-medium leading-none cursor-pointer">Phòng IT</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_kh" name="departments" value="Phòng Kế hoạch Kỹ thuật" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_kh" className="text-sm font-medium leading-none cursor-pointer">Phòng Kế hoạch Kỹ thuật</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_kd" name="departments" value="Phòng Kinh Doanh" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_kd" className="text-sm font-medium leading-none cursor-pointer">Phòng Kinh Doanh</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_xl" name="departments" value="Đội xây lắp - Chống thất thoát" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_xl" className="text-sm font-medium leading-none cursor-pointer">Đội xây lắp - Chống thất thoát</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="dept_sx" name="departments" value="Phân xưởng sản xuất" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
                  <label htmlFor="dept_sx" className="text-sm font-medium leading-none cursor-pointer">Phân xưởng sản xuất</label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 font-semibold">Nội dung / Thành phần tham dự</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Ghi chú thêm về cuộc họp..."
                rows={2}
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
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
