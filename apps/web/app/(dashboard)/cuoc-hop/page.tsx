import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteMeeting } from './actions'
import { DeleteButton } from './delete-button'
import { SuccessAlert } from './success-alert'
import { MeetingFilters } from './meeting-filters'
import { MeetingPagination } from './meeting-pagination'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  searchParams: { [key: string]: string | undefined }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let isAllowed = false
  let isITAdmin = false
  let profile: any = null
  if (user) {
    const { data } = await supabase.from('profiles').select('role, is_admin, department').eq('id', user.id).single()
    profile = data
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

  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, department')
  const profiles = allProfiles || []

  const resolvedSearchParams = await searchParams
  // Xử lý query params
  const view = resolvedSearchParams?.view || 'calendar'
  
  // Các param cho Table view filter
  const q = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q.toLowerCase() : ''
  const statusFilter = typeof resolvedSearchParams?.status === 'string' ? resolvedSearchParams.status : 'all'
  const fromDate = typeof resolvedSearchParams?.from === 'string' ? resolvedSearchParams.from : ''
  const toDate = typeof resolvedSearchParams?.to === 'string' ? resolvedSearchParams.to : ''
  const pageStr = typeof resolvedSearchParams?.page === 'string' ? resolvedSearchParams.page : '1'
  const page = parseInt(pageStr, 10) || 1
  const limit = 10
  const offset = (page - 1) * limit
  
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
  const { data: rawMeetings } = await supabase
    .from('meetings')
    .select('*')
    .order('start_time', { ascending: true })

  const isFullAccess = profile?.is_admin || profile?.department === 'Phòng tổ chức Hành chánh';

  const getDynamicStatus = (meeting: any) => {
    if (meeting.status === 'Đã hủy') return { label: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-200' }
    const now = new Date().getTime()
    const start = new Date(meeting.start_time).getTime()
    const end = new Date(meeting.end_time).getTime()
    
    if (now < start) return { label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (now >= start && now <= end) return { label: 'Đang diễn ra', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    return { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-800 border-slate-200' }
  }

  const renderParticipants = (m: any) => {
    if (!m.departments || m.departments.length === 0) return 'Không có';
    if (m.departments.includes('Tất cả')) return 'Tất cả phòng ban';
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const parts = m.departments.map((d: string) => {
      if (uuidRegex.test(d)) {
        const p = profiles.find((p: any) => p.id === d);
        return p ? p.full_name : 'Unknown';
      }
      return d;
    });
    return parts.join(', ');
  }

  let allFilteredMeetings = (rawMeetings || []).filter((m: any) => {
    // 1. Phân quyền
    let hasAccess = false;
    if (isFullAccess) hasAccess = true;
    else if (user && m.created_by === user.id) hasAccess = true;
    else if (m.departments && m.departments.includes('Tất cả')) hasAccess = true;
    else if (profile?.department && m.departments?.includes(profile.department)) hasAccess = true;
    else if (user && m.departments?.includes(user.id)) hasAccess = true;
    
    if (!hasAccess) return false;

    // 2. Filter dạng Bảng (nếu view = table)
    if (view === 'table') {
      if (q && !m.title?.toLowerCase().includes(q) && !(m.host && m.host.toLowerCase().includes(q)) && !(m.room && m.room.toLowerCase().includes(q))) return false;
      if (fromDate && new Date(m.start_time) < new Date(`${fromDate}T00:00:00.000Z`)) return false;
      if (toDate && new Date(m.start_time) > new Date(`${toDate}T23:59:59.999Z`)) return false;
      if (statusFilter !== 'all') {
         const dStatus = getDynamicStatus(m);
         if (statusFilter === 'upcoming' && dStatus.label !== 'Sắp diễn ra') return false;
         if (statusFilter === 'ongoing' && dStatus.label !== 'Đang diễn ra') return false;
         if (statusFilter === 'ended' && dStatus.label !== 'Đã kết thúc') return false;
         if (statusFilter === 'cancelled' && dStatus.label !== 'Đã hủy') return false;
      }
    }

    return true;
  });

  // Đảo ngược để xếp các cuộc họp mới nhất lên trên trong dạng Bảng
  if (view === 'table') {
    allFilteredMeetings = allFilteredMeetings.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }

  const totalFiltered = allFilteredMeetings.length;
  const meetings = view === 'table' ? allFilteredMeetings.slice(offset, offset + limit) : allFilteredMeetings;

  return (
    <div className="space-y-6">
      <SuccessAlert />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/cuoc-hop" className="hover:text-blue-600 transition-colors">LKWA</Link>
            <span>→</span>
            <span>Quản lý lịch họp</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Lịch họp cơ quan</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
            <Button variant="ghost" size="sm" className={`h-8 ${view === 'table' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-600'}`} asChild>
              <Link href={`?view=table${dateParam ? `&date=${dateParam}` : ''}`}><List className="w-4 h-4 mr-2" /> Dạng bảng</Link>
            </Button>
            <Button variant="ghost" size="sm" className={`h-8 ${view === 'calendar' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-600'}`} asChild>
              <Link href={`?view=calendar${dateParam ? `&date=${dateParam}` : ''}`}><CalendarIcon className="w-4 h-4 mr-2" /> Dạng lịch</Link>
            </Button>
          </div>
          
          {isAllowed && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Link href="/cuoc-hop/create">
                <Plus className="mr-2 h-4 w-4" /> Đăng ký lịch họp
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          
          {view === 'calendar' ? (
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-700">Lịch các sự kiện</h2>
                <div className="flex items-center gap-4">
                  <div className="flex shadow-sm rounded-md overflow-hidden">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-r-none border-blue-400 text-blue-600 hover:bg-blue-50" asChild>
                      <Link href={`/cuoc-hop?view=${view}&date=${prevYear}`} title="Năm trước">
                        <ChevronLeft className="h-4 w-4" strokeWidth={3} />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-blue-400 text-blue-600 border-l-0 hover:bg-blue-50" asChild>
                      <Link href={`/cuoc-hop?view=${view}&date=${prevMonth}`} title="Tháng trước">
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-blue-400 text-blue-600 border-l-0 hover:bg-blue-50" asChild>
                      <Link href={`/cuoc-hop?view=${view}&date=${nextMonth}`} title="Tháng sau">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-l-none border-blue-400 text-blue-600 border-l-0 hover:bg-blue-50" asChild>
                      <Link href={`/cuoc-hop?view=${view}&date=${nextYear}`} title="Năm sau">
                        <ChevronRight className="h-4 w-4" strokeWidth={3} />
                      </Link>
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 border-blue-400 text-blue-600 hover:bg-blue-50 shadow-sm" asChild>
                    <Link href={`/cuoc-hop?view=${view}&date=${todayDate}`}>Hôm nay</Link>
                  </Button>
                </div>
                <div className="text-xl font-bold text-slate-800">
                  Tháng {format(currentDate, 'MM/yyyy')}
                </div>
                <div className="flex rounded-md overflow-hidden border border-blue-400 shadow-sm">
                  <Button variant="ghost" size="sm" className="h-8 rounded-none bg-blue-500 text-white hover:bg-blue-600 hover:text-white" asChild>
                    <Link href={`/cuoc-hop?view=calendar&date=${format(currentDate, 'yyyy-MM-dd')}`}>Tháng</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-none text-blue-600 hover:bg-blue-50 border-l border-blue-400" disabled>Tuần</Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-none border-l border-blue-400 text-blue-600 hover:bg-blue-50" asChild>
                    <Link href={`/cuoc-hop?view=table&date=${format(currentDate, 'yyyy-MM-dd')}`}>Danh sách</Link>
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
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
                        className={`min-h-[140px] p-2 border-r border-b border-slate-200 last:border-r-0 hover:bg-slate-50 transition-colors
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
                        <div className="space-y-1.5 mt-1">
                          {dayMeetings.map(meeting => {
                            const dStatus = getDynamicStatus(meeting)
                            return (
                            <Popover key={meeting.id}>
                              <PopoverTrigger asChild>
                                <div 
                                  className={`text-xs p-1.5 px-2 rounded border cursor-pointer hover:opacity-80 transition-opacity truncate shadow-sm ${dStatus.color}`}
                                  title={`${meeting.title} - ${meeting.room}`}
                                >
                                  {format(new Date(meeting.start_time), 'HH:mm')} {meeting.title}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0 overflow-hidden shadow-lg border-slate-200" align="start">
                                <div className={`p-3 border-b ${dStatus.color}`}>
                                  <h4 className="font-bold text-sm">{meeting.title}</h4>
                                  <div className="text-xs mt-1 opacity-90">{dStatus.label}</div>
                                </div>
                                <div className="p-3 text-sm space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Thời gian:</span>
                                    <span className="font-medium">{format(new Date(meeting.start_time), 'HH:mm')} - {format(new Date(meeting.end_time), 'HH:mm')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Phòng họp:</span>
                                    <span className="font-medium text-right">{meeting.room || 'Chưa sắp xếp'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Chủ trì:</span>
                                    <span className="font-medium text-right">{meeting.host || 'Không có'}</span>
                                  </div>
                                  <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-slate-100">
                                    <span className="text-slate-500">Thành phần tham dự:</span>
                                    <span className="text-slate-800 line-clamp-3">{renderParticipants(meeting)}</span>
                                  </div>
                                  {(user && (meeting.created_by === user.id || isITAdmin)) && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                      <Button size="sm" variant="outline" className="text-blue-600" asChild>
                                        <Link href={`/cuoc-hop/edit/${meeting.id}`}>
                                          <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
                                        </Link>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )})}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <MeetingFilters />
              
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs font-bold text-white uppercase bg-[#1a56db] border-b border-[#1a56db] [&_th]:font-bold [&_th]:whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Tiêu đề</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Thành phần</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Thời gian</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Địa điểm</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Trạng thái</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings && meetings.length > 0 ? (
                      meetings.map((meeting: any) => {
                        const dStatus = getDynamicStatus(meeting)
                        return (
                        <tr key={meeting.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{meeting.title}</div>
                            {meeting.host && <div className="text-xs text-slate-500 mt-1">Chủ trì: {meeting.host}</div>}
                          </td>
                          <td className="px-6 py-4 text-slate-600 max-w-[200px] text-left">
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate block cursor-help">{renderParticipants(meeting)}</span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[400px] whitespace-normal break-words p-3 bg-slate-800 text-slate-50">
                                  <p className="text-sm">{renderParticipants(meeting)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-center whitespace-nowrap">
                            <div className="font-medium">{format(new Date(meeting.start_time), 'dd/MM/yyyy')}</div>
                            <div className="text-xs mt-1 text-slate-500">
                              {format(new Date(meeting.start_time), 'HH:mm')} - {format(new Date(meeting.end_time), 'HH:mm')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-center whitespace-nowrap">
                            {meeting.room || <span className="text-slate-400 italic">Chưa sắp xếp</span>}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${dStatus.color}`}>
                              {dStatus.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {user && (meeting.created_by === user.id || isITAdmin) && (
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                  <Link href={`/cuoc-hop/edit/${meeting.id}`}>
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <form action={deleteMeeting.bind(null, meeting.id)}>
                                  <DeleteButton />
                                </form>
                              </div>
                            )}
                          </td>
                        </tr>
                      )})
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 bg-white">
                          Không có cuộc họp nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <MeetingPagination totalCount={totalFiltered} limit={limit} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
