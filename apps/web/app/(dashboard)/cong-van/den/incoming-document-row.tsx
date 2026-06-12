'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Paperclip } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function IncomingDocumentRow({ 
  doc, 
  isSelected = false, 
  onSelectChange 
}: { 
  doc: any
  isSelected?: boolean
  onSelectChange?: (checked: boolean) => void
}) {
  const router = useRouter()

  const handleRowClick = (e: React.MouseEvent) => {
    // Only navigate if we didn't click on a button, link, or their children
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('.no-row-click')) {
      return
    }
    router.push(`/cong-van/den/${doc.id}?from=incoming`)
  }

  return (
    <tr 
      onClick={handleRowClick}
      className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
    >
      <td className="px-6 py-4">
        <div className="no-row-click flex items-center justify-center">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelectChange} 
            aria-label="Chọn công văn"
          />
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        {doc.priority ? (
          <span className="text-amber-600 font-medium whitespace-nowrap">Quan trọng</span>
        ) : (
          <span className="text-slate-600 whitespace-nowrap">Bình thường</span>
        )}
      </td>
      <td className="px-6 py-4 font-medium text-slate-900 text-center">{doc.symbol_number}</td>
      <td className="px-6 py-4 text-slate-600 max-w-[250px] md:max-w-md text-left">
        <div className="flex items-center gap-2">
          {doc.attachments && Array.isArray(doc.attachments) && doc.attachments.length > 0 && (
            <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate cursor-help">{doc.summary}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] whitespace-normal break-words p-3 bg-slate-800 text-slate-50">
                <p className="text-sm">{doc.summary}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <Badge variant="outline" className="bg-cyan-50 text-cyan-600 border-cyan-200 font-normal whitespace-nowrap">
          {doc.type}
        </Badge>
      </td>
      <td className="px-6 py-4 text-center">{doc.sender_name}</td>
      <td className="px-6 py-4 text-slate-500 text-center">
        {new Date(doc.created_at).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </td>
      <td className="px-6 py-4 text-center flex flex-col gap-1 items-center justify-center">
        {doc.read_status === 'Chưa xem' ? (
          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 font-normal whitespace-nowrap">
            Chưa xem
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-normal whitespace-nowrap">
            Đã xem
          </Badge>
        )}
        <Badge variant="outline" className={`font-normal whitespace-nowrap ${
          doc.processing_status === 'Chưa xử lý' ? 'bg-amber-50 text-amber-600 border-amber-200' :
          doc.processing_status === 'Đang thực hiện' ? 'bg-blue-50 text-blue-600 border-blue-200' :
          doc.processing_status === 'Chờ duyệt' ? 'bg-purple-50 text-purple-600 border-purple-200' :
          doc.processing_status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
          doc.processing_status === 'Đã trả lời/báo cáo' ? 'bg-teal-50 text-teal-600 border-teal-200' :
          doc.processing_status === 'Đã chuyển tiếp' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
          'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          {doc.processing_status}
        </Badge>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="no-row-click">
          <Link href={`/cong-van/den/${doc.id}?from=incoming`} className="text-sm text-blue-600 hover:underline font-medium whitespace-nowrap">
            Xem chi tiết
          </Link>
        </div>
      </td>
    </tr>
  )
}
