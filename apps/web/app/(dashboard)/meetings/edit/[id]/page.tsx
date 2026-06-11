import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateMeeting } from '../../actions'
import Link from 'next/link'
import { MeetingParticipantsSelector } from '@/components/meeting-participants-selector'
import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function EditMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resolvedParams = await params
  
  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!meeting) {
    notFound()
  }

  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin
  const isBanDieuHanh = profile?.department === 'Ban điều hành'
  const isToChucHanhChanh = profile?.department === 'Phòng tổ chức Hành chánh'
  const isFullAccess = profile?.is_admin || isBanDieuHanh || isToChucHanhChanh
  const userDepartment = profile?.department || ''

  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, department, role').order('department');
  const profiles = allProfiles || [];

  // Only creator or ITAdmin can edit
  if (meeting.created_by !== user.id && !isITAdmin) {
    redirect('/meetings')
  }

  // Bind the action to the specific meeting ID
  const updateMeetingWithId = updateMeeting.bind(null, resolvedParams.id)

  // format dates for datetime-local input
  // datetime-local format is YYYY-MM-DDThh:mm
  const formatForInput = (isoString: string) => {
    const d = new Date(isoString)
    // Add timezone offset to display local time correctly in the input
    const tzOffset = d.getTimezoneOffset() * 60000
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16)
    return localISOTime
  }

  const startValue = meeting.start_time ? formatForInput(meeting.start_time) : ''
  const endValue = meeting.end_time ? formatForInput(meeting.end_time) : ''

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <Link href="/meetings" className="hover:text-[#1a56db] transition-colors">LKWA</Link>
        <span>→</span>
        <Link href="/meetings" className="hover:text-[#1a56db]">Quản lý lịch họp</Link>
        <span>→</span>
        <span>Sửa lịch họp</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-[#1a56db]">Sửa lịch họp</h2>
            <p className="text-sm text-slate-500 mt-1">Cập nhật thông tin cuộc họp đã tạo</p>
          </div>
        </div>
        
        <div className="p-4">
          <form action={updateMeetingWithId} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-700 font-semibold">Tiêu đề cuộc họp <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                name="title" 
                defaultValue={meeting.title}
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
                  defaultValue={meeting.host || ''}
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
                  defaultValue={meeting.room}
                  placeholder="Ví dụ: Phòng họp Tầng 1" 
                  required
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-slate-700 font-semibold">Thời gian bắt đầu <span className="text-red-500">*</span></Label>
                <Input 
                  id="start_time" 
                  name="start_time" 
                  type="datetime-local" 
                  defaultValue={startValue}
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
                  defaultValue={endValue}
                  required 
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Thành phần tham dự (Phòng ban / Cá nhân)</Label>
              <div className="mt-2 text-sm text-slate-500 bg-amber-50 p-3 rounded-md border border-amber-200">
                <p>Lưu ý: Bạn không thể thay đổi thành phần tham dự sau khi cuộc họp đã được tạo. Nếu cần thay đổi, vui lòng xóa và tạo cuộc họp mới.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 font-semibold">Ghi chú / Nội dung cuộc họp</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={meeting.description || ''}
                placeholder="Nhập ghi chú hoặc thành phần tham dự bổ sung..." 
                rows={3}
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
              <Button type="button" variant="outline" asChild className="border-slate-300 text-slate-700">
                <Link href="/meetings">Hủy</Link>
              </Button>
              <Button type="submit" className="bg-[#1a56db] hover:bg-[#1546b3] text-white">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
