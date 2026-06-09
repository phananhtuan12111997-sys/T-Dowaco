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
import { updateVehicleRequest } from '../../actions'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { CompanionSelector } from '../../create/companion-selector'
import { redirect } from 'next/navigation'

export default async function EditVehicleRequestPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the request
  const { data: request, error: reqError } = await supabase
    .from('vehicle_requests')
    .select('*')
    .eq('id', params.id)
    .single()

  if (reqError || !request || request.created_by !== user?.id) {
    redirect('/vehicles')
  }

  // Fetch approvers (Ban điều hành)
  const { data: approvers } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .eq('department', 'Ban điều hành')
    .order('full_name')

  // Fetch all users for companions
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, department, avatar_url')
    .order('full_name')

  // Prepare initial selected users
  let initialCompanions: any[] = []
  if (request.companions && Array.isArray(request.companions)) {
    initialCompanions = (allUsers || []).filter(u => request.companions.includes(u.id))
  } else if (typeof request.companions === 'string') {
    try {
      const parsed = JSON.parse(request.companions)
      if (Array.isArray(parsed)) {
        initialCompanions = (allUsers || []).filter(u => parsed.includes(u.id))
      }
    } catch (e) {
      // ignore
    }
  }

  const updateAction = updateVehicleRequest.bind(null, params.id)

  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <span>T-Dowaco</span>
        <span>→</span>
        <Link href="/vehicles" className="hover:text-[#1a56db]">Quản lý xin xe</Link>
        <span>→</span>
        <span>Sửa đăng ký xe</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-[#1a56db]">Sửa phiếu đăng ký xe</h2>
        </div>
        
        <div className="p-6">
          <form action={updateAction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="requester_name" className="text-slate-700 font-semibold">Người đăng ký <span className="text-red-500">*</span></Label>
                <Input 
                  id="requester_name" 
                  name="requester_name" 
                  defaultValue={request.requester_name}
                  placeholder="Nhập tên người đi công tác" 
                  required 
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver_id" className="text-slate-700 font-semibold">Người duyệt <span className="text-red-500">*</span></Label>
                <Select name="approver_id" required defaultValue={request.approver_id}>
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
                defaultValue={request.trip_purpose}
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
                  defaultValue={formatDateTimeLocal(request.start_time)}
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
                  defaultValue={formatDateTimeLocal(request.end_time)}
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
                defaultValue={request.vehicle_info}
                placeholder="Ví dụ: Xe Fortuner 7 chỗ - Tài xế Hùng"
                required
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <CompanionSelector allUsers={allUsers || []} initialSelectedUsers={initialCompanions} />

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" asChild className="border-slate-300 text-slate-700">
                <Link href="/vehicles">Hủy bỏ</Link>
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
