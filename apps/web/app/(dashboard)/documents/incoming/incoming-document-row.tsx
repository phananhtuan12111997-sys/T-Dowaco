'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function IncomingDocumentRow({ doc }: { doc: any }) {
  const router = useRouter()

  const handleRowClick = (e: React.MouseEvent) => {
    // Only navigate if we didn't click on a button, link, or their children
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('.no-row-click')) {
      return
    }
    router.push(`/documents/incoming/${doc.id}`)
  }

  return (
    <tr 
      onClick={handleRowClick}
      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <td className="px-6 py-4 text-center">
        {doc.priority ? (
          <span className="text-amber-600 font-medium whitespace-nowrap">Quan trọng</span>
        ) : (
          <span className="text-slate-600 whitespace-nowrap">Bình thường</span>
        )}
      </td>
      <td className="px-6 py-4 font-medium text-slate-900 text-center">{doc.symbol_number}</td>
      <td className="px-6 py-4 text-slate-600 max-w-md truncate text-center" title={doc.summary}>
        {doc.summary}
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
      <td className="px-6 py-4 text-center">
        <Badge variant="outline" className={`font-normal whitespace-nowrap ${
          doc.processing_status === 'Chưa xử lý' && doc.read_status === 'Chưa xem' ? 'bg-slate-50 text-slate-600 border-slate-200' :
          doc.processing_status === 'Chưa xử lý' && doc.read_status === 'Đã xem' ? 'bg-amber-50 text-amber-600 border-amber-200' :
          doc.processing_status === 'Đã trả lời/báo cáo' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
          doc.processing_status === 'Đã chuyển tiếp' ? 'bg-blue-50 text-blue-600 border-blue-200' :
          'bg-green-50 text-green-600 border-green-200'
        }`}>
          {doc.read_status} / {doc.processing_status}
        </Badge>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="no-row-click">
          <Link href={`/documents/incoming/${doc.id}`} className="text-sm text-blue-600 hover:underline font-medium whitespace-nowrap">
            Xem chi tiết
          </Link>
        </div>
      </td>
    </tr>
  )
}
