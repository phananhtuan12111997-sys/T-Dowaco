'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Task {
  id: string
  title: string
  assigner_name?: string
  assignee_name?: string
  priority: string
  due_date: string | null
  processing_status: string
  read_status?: string
  [key: string]: any
}

export function TaskRow({ 
  task, 
  isSent = false, 
  showActions = false,
  isSelected,
  onSelectChange,
  onDelete
}: { 
  task: Task, 
  isSent?: boolean,
  showActions?: boolean,
  isSelected?: boolean,
  onSelectChange?: (checked: boolean) => void,
  onDelete?: (id: string) => Promise<any>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Bạn có chắc chắn muốn xoá công việc này? Thao tác này không thể hoàn tác.')) {
      startTransition(async () => {
        if (onDelete) {
          const result = await onDelete(task.id)
          if (result?.error) {
            alert(result.error)
          }
        }
      })
    }
  }

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('.no-row-click')) {
      return
    }
    router.push(`/cong-viec/${task.id}?from=${isSent ? 'sent' : 'incoming'}`)
  }

  const isUnread = !isSent && task.read_status === 'Chưa xem'

  return (
    <tr 
      onClick={handleRowClick}
      className={`bg-white border-b hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
    >
      {!isSent && (
        <td className="px-6 py-4">
          <div className="no-row-click flex items-center justify-center">
            <Checkbox 
              checked={isSelected} 
              onCheckedChange={onSelectChange} 
              aria-label="Chọn công việc"
            />
          </div>
        </td>
      )}
      <td className="px-6 py-4">
        <div className={`font-medium ${isUnread ? 'text-black font-bold' : 'text-slate-800'}`}>
          <div className="flex items-center gap-2">
            {isUnread && (
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-[10px] px-1.5 py-0 h-4">Mới</Badge>
            )}
            {task.title}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-600 max-w-[250px] md:max-w-xs text-left">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate block cursor-help">{task.description || 'Không có mô tả'}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[400px] whitespace-normal break-words p-3 bg-slate-800 text-slate-50">
              <p className="text-sm">{task.description || 'Không có mô tả'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        {isSent ? task.assignee_name : task.assigner_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <Badge variant={task.priority === 'Quan trọng' ? 'destructive' : 'secondary'} className="font-normal">
          {task.priority || 'Bình thường'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
        {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Không có'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <Badge variant="outline" className={`font-normal ${
          task.processing_status === 'Đã hoàn thành' ? 'bg-green-50 text-green-700 border-green-200' :
          task.processing_status === 'Đang thực hiện' ? 'bg-blue-50 text-blue-700 border-blue-200' :
          task.processing_status === 'Chờ duyệt' ? 'bg-orange-50 text-orange-700 border-orange-200' :
          task.processing_status === 'Trả về' ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-slate-50 text-slate-700 border-slate-200'
        }`}>
          {task.processing_status}
        </Badge>
      </td>
      {showActions && (
        <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center gap-2">
            <button 
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors" 
              onClick={() => router.push(`/cong-viec/${task.id}?from=${isSent ? 'sent' : 'incoming'}`)}
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            {isSent && (
              <button 
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50" 
                onClick={handleDelete}
                disabled={isPending}
                title="Xoá công việc"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}
