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
import { createClient } from '@/utils/supabase/server'
import { CompanionSelector } from './companion-selector'

export default async function CreateVehicleRequestPage() {
  const supabase = await createClient()
  
  // Fetch approver (Nguyễn Văn Hoà)
  const { data: approvers } = await supabase
    .from('profiles')
    .select('id, full_name, department, username')
    .eq('username', 'nguyenvanhoa')

  // Fetch all users for companions
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .order('full_name')
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <span>LKW</span>
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
                <Label htmlFor="approver_id" className="text-slate-700 font-semibold">Người duyệt <span className="text-red-500">*</span></Label>
                <Select name="approver_id" required defaultValue={approvers?.[0]?.id}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Chọn người duyệt" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvers?.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                    ))}
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
                <Label htmlFor="end_time" className="text-slate-700 font-semibold">Thời gian về <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="vehicle_info" className="text-slate-700 font-semibold">Phương tiện & Tài xế đề xuất <span className="text-red-500">*</span></Label>
              <Input 
                id="vehicle_info" 
                name="vehicle_info" 
                placeholder="Ví dụ: Xe Fortuner 7 chỗ - Tài xế Hùng"
                required
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <CompanionSelector allUsers={allUsers || []} />

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
