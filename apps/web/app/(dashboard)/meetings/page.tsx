import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteMeeting } from './actions'
import { DeleteButton } from './delete-button'
import { SuccessAlert } from './success-alert'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
  addYears,
  subYears
} from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: { view?: string, date?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let isAllowed = false
  let isITAdmin = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role, is_admin, department').eq('id', user.id).single()
    if (profile) {
      const allowedRoles = ['Kế toán trưởng', 'Trưởng phòng', 'Phó phòng', 'Đội trưởng', 'Đội phó', 'Quản đốc', 'Phó quản đốc']
      const isBanDieuHanh = profile.department === 'Ban điều hành'
      const isToChucHanhChanh = profile.department === 'Phòng tổ chức Hành chánh'
      
      if (profile.is_admin || isBanDieuHanh || isToChucHanhChanh || allowedRoles.includes(profile.role)) {
        isAllowed = true
      }
    }
    if (profile && (profile.department === 'Phòng IT' || profile.is_admin)) {
      isITAdmin = true
    }
  }

  const resolvedSearchParams = await searchParams
  // Xử lý query params
  const view = resolvedSearchParams?.view || 'calendar'
  
  // Tính toán thời gian cho Lịch
  const dateParam = resolvedSearchParams?.date
  const currentDate = dateParam ? new Date(dateParam) : new Date()
  const prevMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd')
  const nextMonth = format(addMonths(currentDate, 1), 'yyyy-MM-dd')
  const prevYear = format(subYears(currentDate, 1), 'yyyy-MM-dd')
  const nextYear = format(addYears(currentDate, 1), 'yyyy-MM-dd')
  const todayDate = format(new Date(), 'yyyy-MM-dd')
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const dateFormat = "d"
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  })

  // Lấy danh sách lịch họp
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .order('start_time', { ascending: true })

  // Lọc cuộc họp sắp tới (từ hôm nay trở đi)
  const upcomingMeetings = meetings && meetings.length > 0 
    ? meetings.filter((m: any) => new Date(m.start_time) >= new Date()).sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    : []

  const myCreatedMeetings = meetings && meetings.length > 0 && user
    ? meetings.filter((m: any) => m.created_by === user.id).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    : []

  return (
    <div className="space-y-6">
      <SuccessAlert />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/meetings" className="hover:text-blue-600 transition-colors">LKW</Link>
            <span>→</span>
            <span>Quản lý lịch họp</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Lịch họp cơ quan</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
            <Button variant="ghost" size="sm" className={`h-8 ${view === 'table' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-600'}`} asChild>
              <Link href="?view=table"><List className="w-4 h-4 mr-2" /> Dạng bảng</Link>
            </Button>
            <Button variant="ghost" size="sm" className={`h-8 ${view === 'calendar' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-600'}`} asChild>
              <Link href="?view=calendar"><CalendarIcon className="w-4 h-4 mr-2" /> Dạng lịch</Link>
            </Button>
          </div>
          
          {isAllowed && (
            <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Link href="/meetings/create">
                <Plus className="mr-2 h-4 w-4" /> Đăng ký lịch họp
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          
          {view === 'calendar' ? (
            <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-700">Full Calendar</h2>
            <div className="flex items-center gap-4">
              <div className="flex">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-r-none border-blue-400 text-blue-600 hover:bg-blue-50" asChild>
                  <Link href={`/meetings?view=${view}&date=${prevYear}`} title="Năm trước">
                    <ChevronLeft className="h-4 w-4" strokeWidth={3} />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-blue-400 text-blue-600 border-l-0 hover:bg-blue-50" asChild>
                  <Link href={`/meetings?view=${view}&date=${prevMonth}`} title="Tháng trước">
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-blue-400 text-blue-600 border-l-0 hover:bg-blue-50" asChild>
                  <Link href={`/meetings?view=${view}&date=${nextMonth}`} title="Tháng sau">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-l-none border-blue-400 text-blue-600 border-l-0 hover:bg-blue-50" asChild>
                  <Link href={`/meetings?view=${view}&date=${nextYear}`} title="Năm sau">
                    <ChevronRight className="h-4 w-4" strokeWidth={3} />
                  </Link>
                </Button>
              </div>
              <Button variant="outline" size="sm" className="h-8 border-blue-400 text-blue-600 hover:bg-blue-50 bg-blue-50" asChild>
                <Link href={`/meetings?view=${view}&date=${todayDate}`}>Hôm nay</Link>
              </Button>
            </div>
            <div className="text-xl font-bold text-slate-800">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <div className="flex rounded-md overflow-hidden border border-blue-400">
              <Button variant="ghost" size="sm" className="h-8 rounded-none bg-blue-500 text-white hover:bg-blue-600 hover:text-white" asChild>
                <Link href={`/meetings?view=calendar&date=${format(currentDate, 'yyyy-MM-dd')}`}>Tháng</Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-none text-blue-600 hover:bg-blue-50 border-l border-blue-400" disabled>Tuần</Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-none border-l border-blue-400 text-blue-600 hover:bg-blue-50" asChild>
                <Link href={`/meetings?view=table&date=${format(currentDate, 'yyyy-MM-dd')}`}>Danh sách</Link>
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-200 rounded-md overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2 text-center text-sm font-semibold text-slate-600 border-r last:border-r-0 border-slate-200">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {days.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, monthStart)
                // Lọc sự kiện trong ngày này
                const dayMeetings = meetings?.filter(m => isSameDay(new Date(m.start_time), day)) || []

                return (
                  <div 
                    key={day.toString()}
                    className={`min-h-[120px] p-2 border-r border-b border-slate-200 last:border-r-0 hover:bg-slate-50 transition-colors
                      ${!isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'text-slate-700'}
                      ${isToday(day) ? 'bg-blue-50/30' : ''}
                    `}
                  >
                    <div className="flex justify-end mb-1">
                      <div className={`text-sm w-7 h-7 flex items-center justify-center rounded-full
                        ${isToday(day) ? 'bg-blue-600 text-white font-bold' : ''}
                      `}>
                        {format(day, dateFormat)}
                      </div>
                    </div>
                    
                    {/* Danh sách sự kiện trong ngày */}
                    <div className="space-y-1 mt-1">
                      {dayMeetings.map(meeting => (
                        <div 
                          key={meeting.id}
                          className="text-xs p-1 px-2 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 truncate cursor-pointer hover:bg-emerald-200"
                          title={`${meeting.title} - ${meeting.room}`}
                        >
                          {format(new Date(meeting.start_time), 'HH:mm')} {meeting.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-700">Danh sách cuộc họp</h2>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">TIÊU ĐỀ</th>
                      <th className="px-6 py-4 font-medium">THỜI GIAN</th>
                      <th className="px-6 py-4 font-medium">ĐỊA ĐIỂM</th>
                      <th className="px-6 py-4 font-medium text-center">TRẠNG THÁI</th>
                      <th className="px-6 py-4 font-medium text-right">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings && meetings.length > 0 ? (
                      meetings.map((meeting: any) => (
                        <tr key={meeting.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{meeting.title}</div>
                            {meeting.host && <div className="text-xs text-slate-500 mt-1">Chủ trì: {meeting.host}</div>}
                            {meeting.description && <div className="text-xs text-slate-500 mt-1 truncate max-w-[250px]">{meeting.description}</div>}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div>{format(new Date(meeting.start_time), 'dd/MM/yyyy')}</div>
                            <div className="text-xs mt-1 text-slate-500">
                              {format(new Date(meeting.start_time), 'HH:mm')} - {format(new Date(meeting.end_time), 'HH:mm')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {meeting.room || <span className="text-slate-400 italic">Chưa sắp xếp</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {meeting.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {user && (meeting.created_by === user.id || isITAdmin) && (
                              <div className="flex items-center justify-end gap-2">
                                {user && (meeting.created_by === user.id || isITAdmin) && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                    <Link href={`/meetings/edit/${meeting.id}`}>
                                      <Pencil className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}
                                <form action={deleteMeeting.bind(null, meeting.id)}>
                                  <DeleteButton />
                                </form>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          Không có cuộc họp nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-fit">
          <h3 className="font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">Cuộc họp sắp tới</h3>
          
          <div className="space-y-4">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.slice(0, 5).map((meeting: any) => (
                <div key={meeting.id} className="border-l-4 border-emerald-500 pl-3 py-1">
                  <div className="font-medium text-slate-800 text-sm">{meeting.title}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {format(new Date(meeting.start_time), 'dd/MM/yyyy HH:mm')}
                  </div>
                  {meeting.room && (
                    <div className="text-xs text-slate-500 mt-1">Phòng: {meeting.room}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 italic">Không có cuộc họp sắp tới</div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">Cuộc họp đã tạo</h3>
            
            <div className="space-y-4">
              {myCreatedMeetings.length > 0 ? (
                myCreatedMeetings.slice(0, 10).map((meeting: any) => (
                  <div key={meeting.id} className="border-l-4 border-blue-500 pl-3 py-1 flex justify-between items-start">
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{meeting.title}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(meeting.start_time), 'dd/MM/yyyy HH:mm')}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Phòng: {meeting.room}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                        <Link href={`/meetings/edit/${meeting.id}`}>
                          <Pencil className="h-3 w-3" />
                        </Link>
                      </Button>
                      <form action={deleteMeeting.bind(null, meeting.id)}>
                        <DeleteButton />
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 italic">Bạn chưa tạo cuộc họp nào trong tháng này</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
