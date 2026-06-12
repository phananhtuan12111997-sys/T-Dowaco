import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMeeting } from '../actions'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { MeetingParticipantsSelector } from '@/components/meeting-participants-selector'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CreateMeetingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isBanDieuHanh = profile?.department === 'Ban điều hành'
  const isToChucHanhChanh = profile?.department === 'Phòng tổ chức Hành chánh'
  const isFullAccess = profile?.is_admin || isBanDieuHanh || isToChucHanhChanh
  const userDepartment = profile?.department || ''

  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, department, role').order('department');
  const profiles = allProfiles || [];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <Link href="/meetings" className="hover:text-[#1a56db] transition-colors">LKWA</Link>
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
              <Label className="text-slate-700 font-semibold">Thành phần tham dự (Phòng ban / Cá nhân)</Label>
              <div className="mt-2">
                <MeetingParticipantsSelector 
                  profiles={profiles} 
                  isFullAccess={!!isFullAccess} 
                  userDepartment={userDepartment} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 font-semibold">Nội dung cuộc họp / Ghi chú thêm</Label>
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
              <SubmitButton className="bg-blue-600 hover:bg-blue-700 text-white px-8" loadingText="Đang tạo...">
                Tạo lịch họp
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
