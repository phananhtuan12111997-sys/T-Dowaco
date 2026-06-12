'use client'

import { useState } from 'react'
import { TaskRow } from '@/components/task-row'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Check, CheckCircle2, Loader2, Calendar } from 'lucide-react'
import { markTasksAsRead, acceptTasks } from './actions'
import { useRouter } from 'next/navigation'

export function IncomingTasksTable({ tasks }: { tasks: any[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(tasks.map(t => t.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
    }
  }

  const handleMarkAsRead = async () => {
    if (!selectedIds.length) return
    setIsProcessing(true)
    await markTasksAsRead(selectedIds)
    setSelectedIds([])
    setIsProcessing(false)
    router.refresh()
  }

  const handleAccept = async () => {
    if (!selectedIds.length) return
    setIsProcessing(true)
    await acceptTasks(selectedIds)
    setSelectedIds([])
    setIsProcessing(false)
    router.refresh()
  }

  return (
    <div className="relative">
      {selectedIds.length > 0 && (
        <div className="absolute -top-14 left-0 right-0 bg-blue-50 border border-blue-200 p-2 px-4 rounded-md flex items-center justify-between z-10 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-blue-700">Đã chọn {selectedIds.length} công việc</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100" onClick={handleMarkAsRead} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Đánh dấu đã xem
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAccept} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Tiếp nhận
            </Button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-10">
                <Checkbox 
                  checked={tasks.length > 0 && selectedIds.length === tasks.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Chọn tất cả"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Tên công việc</th>
              <th className="px-6 py-4 font-semibold">Trích yếu</th>
              <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Người giao</th>
              <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Độ ưu tiên</th>
              <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Thời hạn</th>
              <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Tiến độ chung</th>
              <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tasks && tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task} 
                  isSent={false} 
                  showActions={true} 
                  isSelected={selectedIds.includes(task.id)}
                  onSelectChange={(checked) => handleSelectOne(task.id, checked)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Calendar className="w-8 h-8 text-slate-300" />
                    <p>Bạn chưa có công việc nào cần thực hiện</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
