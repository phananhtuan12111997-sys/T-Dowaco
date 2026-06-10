'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Trash2, Loader2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  assigner_name?: string
  assignee_name?: string
  priority: string
  due_date: string | null
  processing_status: string
  [key: string]: any
}

export function TaskRow({ 
  task, 
  isSent = false, 
  showActions = false,
  onDelete
}: { 
  task: Task, 
  isSent?: boolean,
  showActions?: boolean,
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

  return (
    <tr 
      onClick={() => router.push(`/tasks/${task.id}?from=${isSent ? 'sent' : 'incoming'}`)}
      className="bg-white border-b hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4">
        <div className="font-medium text-slate-800 line-clamp-2 max-w-md">
          {task.title}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isSent ? task.assignee_name : task.assigner_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
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
              onClick={() => router.push(`/tasks/${task.id}?from=${isSent ? 'sent' : 'incoming'}`)}
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
