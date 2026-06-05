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
import { createVehicleRequest } from '../actions'
import Link from 'next/link'

export default function CreateVehicleRequestPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <span>T-Dowaco</span>
        <span>→</span>
        <Link href="/vehicles" className="hover:text-[#1a56db]">Quản lý xin xe</Link>
        <span>→</span>
        <span>Đăng ký xe mới</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-[#1a56db]">Phiếu đăng ký xe</h2>
          <p className="text-sm text-slate-500 mt-1">Vui lòng điền đầy đủ thông tin chuyến đi để đội xe sắp xếp</p>
        </div>
        
        <div className="p-6">
          <form action={createVehicleRequest} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="requester_name" className="text-slate-700 font-semibold">Người đăng ký <span className="text-red-500">*</span></Label>
                <Input 
                  id="requester_name" 
                  name="requester_name" 
                  placeholder="Nhập tên người đi công tác" 
                  required 
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-700 font-semibold">Trạng thái (Ban đầu)</Label>
                <Select name="status" defaultValue="Chờ duyệt">
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
                    <SelectItem value="Đã duyệt">Đã duyệt</SelectItem>
                    <SelectItem value="Từ chối">Từ chối</SelectItem>
                    <SelectItem value="Đã hoàn thành">Đã hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trip_purpose" className="text-slate-700 font-semibold">Thông tin chuyến đi (Nơi đến / Mục đích) <span className="text-red-500">*</span></Label>
              <Input 
                id="trip_purpose" 
                name="trip_purpose" 
                placeholder="Ví dụ: Đi họp tại Sở Tài Nguyên & Môi Trường Đồng Nai" 
                required 
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-slate-700 font-semibold">Thời gian đi <span className="text-red-500">*</span></Label>
                <Input 
                  id="start_time" 
                  name="start_time" 
                  type="datetime-local"
                  required
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-slate-700 font-semibold">Thời gian về (Dự kiến)</Label>
                <Input 
                  id="end_time" 
                  name="end_time" 
                  type="datetime-local"
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_info" className="text-slate-700 font-semibold">Phương tiện & Tài xế đề xuất (Nếu có)</Label>
              <Input 
                id="vehicle_info" 
                name="vehicle_info" 
                placeholder="Ví dụ: Xe Fortuner 7 chỗ - Tài xế Hùng"
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" asChild className="border-slate-300 text-slate-700">
                <Link href="/vehicles">Hủy bỏ</Link>
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                Gửi đăng ký
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
