import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTask } from '../actions'
import Link from 'next/link'

export default function CreateTaskPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <span>T-Dowaco</span>
        <span>→</span>
        <Link href="/tasks" className="hover:text-[#1a56db]">Quản lý công việc</Link>
        <span>→</span>
        <span>Thêm công việc mới</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-[#1a56db]">Tạo công việc mới</h2>
          <p className="text-sm text-slate-500 mt-1">Điền thông tin chi tiết để giao hoặc ghi nhận công việc mới</p>
        </div>
        
        <div className="p-6">
          <form action={createTask} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-700 font-semibold">Tên công việc <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Nhập tên công việc..." 
                required 
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-700 font-semibold">Mức độ ưu tiên</Label>
                <Select name="priority" defaultValue="Trung bình">
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Chọn mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Thấp">Thấp</SelectItem>
                    <SelectItem value="Trung bình">Trung bình</SelectItem>
                    <SelectItem value="Cao">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-slate-700 font-semibold">Hạn hoàn thành</Label>
                <Input 
                  id="due_date" 
                  name="due_date" 
                  type="date"
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assigner_name" className="text-slate-700 font-semibold">Người giao</Label>
                <Input 
                  id="assigner_name" 
                  name="assigner_name" 
                  placeholder="Nhập tên người giao (nếu có)"
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-700 font-semibold">Trạng thái khởi tạo</Label>
                <Select name="status" defaultValue="Chưa bắt đầu">
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chưa bắt đầu">Chưa bắt đầu</SelectItem>
                    <SelectItem value="Đang thực hiện">Đang thực hiện</SelectItem>
                    <SelectItem value="Đã hoàn thành">Đã hoàn thành</SelectItem>
                    <SelectItem value="Quá hạn">Quá hạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" asChild className="border-slate-300 text-slate-700">
                <Link href="/tasks">Hủy bỏ</Link>
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                Tạo công việc
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
