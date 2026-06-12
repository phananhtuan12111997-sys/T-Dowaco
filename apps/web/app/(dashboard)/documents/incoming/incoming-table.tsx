'use client'

import { useState } from 'react'
import { IncomingDocumentRow } from './incoming-document-row'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Check, CheckCircle2, Loader2 } from 'lucide-react'
import { markDocumentsAsRead, acceptDocuments } from './actions'
import { useRouter } from 'next/navigation'

export function IncomingTable({ documents }: { documents: any[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(documents.map(d => d.id))
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
    await markDocumentsAsRead(selectedIds)
    setSelectedIds([])
    setIsProcessing(false)
    router.refresh()
  }

  const handleAccept = async () => {
    if (!selectedIds.length) return
    setIsProcessing(true)
    await acceptDocuments(selectedIds)
    setSelectedIds([])
    setIsProcessing(false)
    router.refresh()
  }

  return (
    <div className="relative">
      {selectedIds.length > 0 && (
        <div className="absolute -top-14 left-0 right-0 bg-blue-50 border border-blue-200 p-2 px-4 rounded-md flex items-center justify-between z-10 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-blue-700">Đã chọn {selectedIds.length} công văn</span>
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
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-10">
                <Checkbox 
                  checked={documents.length > 0 && selectedIds.length === documents.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Chọn tất cả"
                />
              </th>
              <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Ưu tiên</th>
              <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Số ký hiệu</th>
              <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Trích yếu</th>
              <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Loại văn bản</th>
              <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Người gửi</th>
              <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Ngày gửi</th>
              <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-center whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <IncomingDocumentRow 
                  key={doc.id} 
                  doc={doc} 
                  isSelected={selectedIds.includes(doc.id)}
                  onSelectChange={(checked) => handleSelectOne(doc.id, checked)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                  Chưa có công văn nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
