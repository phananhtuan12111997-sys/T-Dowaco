'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ReportDetailsModal } from './report-details-modal'
import { ForwardedDetailsModal } from './forwarded-details-modal'
import { useRouter } from 'next/navigation'

export function StatusDetailsModal({ readCount, totalCount, recipients, documentId }: { readCount: number, totalCount: number, recipients: any[], documentId?: string }) {
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [selectedForwarded, setSelectedForwarded] = useState<any>(null)
  const [localRecipients, setLocalRecipients] = useState<any[]>(recipients || [])
  const router = useRouter()

  useEffect(() => {
    setLocalRecipients(recipients || [])
  }, [recipients])

  const handleCompleteRecipient = (userId: string) => {
    setLocalRecipients(prev => prev.map(r => 
      (r.user_id === userId || r.profile?.id === userId || r.profiles?.id === userId) 
        ? { ...r, processing_status: 'Hoàn thành' } 
        : r
    ))
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1 items-center mx-auto w-fit">

      {totalCount > 0 && (
        <>
          <Dialog>
            <DialogTrigger asChild>
               <span className="text-xs text-[#1a56db] whitespace-nowrap cursor-pointer hover:underline">
                 Xem chi tiết
               </span>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Chi tiết trạng thái xử lý</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                <div className="text-sm text-slate-600 mb-4 border-b pb-2">
                  <strong>Tổng quan:</strong> {readCount}/{totalCount} người đã xem
                </div>
                {localRecipients?.map((r: any) => {
                  const isClickable = r.processing_status && r.processing_status !== 'Chưa xử lý'
                  const isForwarded = r.processing_status === 'Đã chuyển tiếp'
                  const p = r.profile || r.profiles;
                  return (
                    <div 
                      key={r.id} 
                      onClick={() => {
                        if (!isClickable) return
                        if (isForwarded) setSelectedForwarded(r)
                        else setSelectedRecipient(r)
                      }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border ${
                        isClickable 
                          ? 'bg-blue-50/50 border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors' 
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 overflow-hidden shrink-0">
                          {p?.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            p?.full_name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-slate-800 truncate">{p?.full_name || 'Người dùng không xác định'}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {p?.department || 'Chưa có phòng ban'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end shrink-0">
                         <Badge variant="outline" className={r.status === 'Đã xem' ? 'bg-green-50 text-green-700 border-green-200 font-normal' : 'bg-slate-100 text-slate-600 border-slate-200 font-normal'}>
                           {r.status || 'Chưa xem'}
                         </Badge>
                         <Badge variant="outline" className={
                           r.processing_status === 'Chưa xử lý' ? 'bg-amber-50 text-amber-700 border-amber-200 font-normal' : 
                           r.processing_status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-normal' :
                           'bg-blue-50 text-blue-700 border-blue-200 font-normal'
                         }>
                           {r.processing_status || 'Chưa xử lý'}
                         </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

          {selectedRecipient && documentId && (
            <ReportDetailsModal 
              open={!!selectedRecipient} 
              onOpenChange={(open) => !open && setSelectedRecipient(null)}
              documentId={documentId}
              recipient={selectedRecipient}
              onComplete={() => handleCompleteRecipient(selectedRecipient.user_id || selectedRecipient.profile?.id || selectedRecipient.profiles?.id)}
            />
          )}

          {selectedForwarded && documentId && (
            <ForwardedDetailsModal 
              open={!!selectedForwarded}
              onOpenChange={(open) => !open && setSelectedForwarded(null)}
              originalDocumentId={documentId}
              forwarderUserId={selectedForwarded.user_id || selectedForwarded.profile?.id || selectedForwarded.profiles?.id}
              forwarderProfile={selectedForwarded.profiles || selectedForwarded.profile}
            />
          )}
        </>
      )}
    </div>
  )
}
