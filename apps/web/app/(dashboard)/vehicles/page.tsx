import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Edit, Trash2, History, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Hàm phụ trợ để render badge trạng thái
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Chờ duyệt':
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Chờ duyệt</Badge>
    case 'Đã duyệt':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Đã duyệt</Badge>
    case 'Từ chối':
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Từ chối</Badge>
    case 'Đã hoàn thành':
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Đã hoàn thành</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default async function VehiclesPage() {
  const supabase = await createClient()
  
  const { data: requests } = await supabase
    .from('vehicle_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>T-Dowaco</span>
            <span>→</span>
            <span>Quản lý xin xe</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Hệ thống Đăng ký Xe</h1>
        </div>
        
        <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Link href="/vehicles/create">
            <Plus className="mr-2 h-4 w-4" /> Đăng ký xe mới
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Lịch sử đăng ký</h2>
          </div>
          
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm nhanh..."
              className="pr-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">NGƯỜI ĐĂNG KÝ</th>
                <th className="px-6 py-4 font-medium">THÔNG TIN CHUYẾN ĐI</th>
                <th className="px-6 py-4 font-medium text-center">THỜI GIAN</th>
                <th className="px-6 py-4 font-medium text-center">PHƯƠNG TIỆN & TÀI XẾ</th>
                <th className="px-6 py-4 font-medium text-center">TRẠNG THÁI</th>
                <th className="px-6 py-4 font-medium text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {requests && requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-900">{req.requester_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 max-w-xs">{req.trip_purpose}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      <div>
                        <span className="text-slate-400 text-xs mr-1">Đi:</span> 
                        {new Date(req.start_time).toLocaleString('vi-VN', {
                          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </div>
                      {req.end_time && (
                        <div className="mt-1">
                          <span className="text-slate-400 text-xs mr-1">Về:</span> 
                          {new Date(req.end_time).toLocaleString('vi-VN', {
                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {req.vehicle_info || <span className="text-slate-400 italic">Chưa sắp xếp</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Mở menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4 text-slate-500" />
                            <span>Chỉnh sửa</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Xóa</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy dữ liệu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
