import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Hàm phụ trợ để render badge trạng thái
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Chưa bắt đầu':
      return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Chưa bắt đầu</Badge>
    case 'Đang thực hiện':
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Đang thực hiện</Badge>
    case 'Đã hoàn thành':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Đã hoàn thành</Badge>
    case 'Quá hạn':
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Quá hạn</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// Hàm phụ trợ để render ưu tiên
function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case 'Cao':
      return <span className="text-red-600 font-medium">Cao</span>
    case 'Trung bình':
      return <span className="text-amber-600 font-medium">Trung bình</span>
    case 'Thấp':
      return <span className="text-slate-600 font-medium">Thấp</span>
    default:
      return <span>{priority}</span>
  }
}

export default async function TasksPage() {
  const supabase = await createClient()
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>T-Dowaco</span>
            <span>→</span>
            <span>Quản lý công việc</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Danh sách công việc</h1>
        </div>
        
        <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Link href="/tasks/create">
            <Plus className="mr-2 h-4 w-4" /> Thêm công việc
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <h2 className="font-semibold text-slate-800">Theo dõi tiến độ thực hiện</h2>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Tìm tên việc..."
                className="pr-9"
              />
            </div>
            
            <div className="w-full sm:w-[150px]">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="-- Trạng thái --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Chưa bắt đầu">Chưa bắt đầu</SelectItem>
                  <SelectItem value="Đang thực hiện">Đang thực hiện</SelectItem>
                  <SelectItem value="Đã hoàn thành">Đã hoàn thành</SelectItem>
                  <SelectItem value="Quá hạn">Quá hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Tên công việc & Tiến độ</th>
                <th className="px-6 py-4 font-medium text-center">Ưu tiên</th>
                <th className="px-6 py-4 font-medium text-center">Hạn hoàn thành</th>
                <th className="px-6 py-4 font-medium text-center">Người giao</th>
                <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 mb-1">{task.title}</div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{task.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {task.assigner_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={task.status} />
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
