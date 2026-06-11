import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

export default async function ViewMeetingPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <Link href="/meetings" className="hover:text-[#1a56db] transition-colors">LKWA</Link>
        <span>→</span>
        <Link href="/meetings" className="hover:text-[#1a56db]">Quản lý lịch họp</Link>
        <span>→</span>
        <span>Chi tiết lịch họp</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-[#1a56db]">Chi tiết cuộc họp</h2>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tiêu đề</h3>
            <p className="text-lg font-medium text-slate-900">{meeting.title}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Người chủ trì</h3>
              <p className="text-slate-900">{meeting.host || 'Không có'}</p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Phòng họp / Địa điểm</h3>
              <p className="text-slate-900">{meeting.room}</p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Thời gian bắt đầu</h3>
              <p className="text-slate-900">{format(new Date(meeting.start_time), 'HH:mm - dd/MM/yyyy')}</p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Thời gian kết thúc</h3>
              <p className="text-slate-900">{format(new Date(meeting.end_time), 'HH:mm - dd/MM/yyyy')}</p>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Nội dung / Mô tả</h3>
            <div className="text-slate-700 whitespace-pre-wrap mt-2 bg-slate-50 p-4 rounded-md border border-slate-100">
              {meeting.description || <span className="italic text-slate-400">Không có mô tả</span>}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="outline" asChild>
              <Link href="/meetings">Trở lại danh sách</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
