'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users } from 'lucide-react'
import { useState } from 'react'
import { ReportDetailsModal } from '../../sent/report-details-modal'
import { ForwardedDetailsModal } from '../../sent/forwarded-details-modal'

interface Recipient {
  id: string
  status: string
  processing_status: string
  viewed_at: string | null
  user_id: string
  profile: {
    id: string
    full_name: string
    department: string
    avatar_url: string | null
  }
}

interface RecipientListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipients: Recipient[]
}

export function RecipientListModal({ open, onOpenChange, recipients, documentId }: RecipientListModalProps & { documentId?: string }) {
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [selectedForwarded, setSelectedForwarded] = useState<any>(null)

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6 text-blue-600" />
            Danh sách người nhận & Theo dõi
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">NGƯỜI NHẬN</th>
                <th className="px-4 py-3 font-medium text-center">TRẠNG THÁI</th>
                <th className="px-4 py-3 font-medium text-center">THỜI GIAN XEM</th>
              </tr>
            </thead>
            <tbody>
              {recipients && recipients.length > 0 ? (
                recipients.map((recipient) => {
                  const isClickable = recipient.processing_status && recipient.processing_status !== 'Chưa xử lý'
                  const isForwarded = recipient.processing_status === 'Đã chuyển tiếp'
                  return (
                  <tr 
                    key={recipient.id} 
                    onClick={() => {
                      if (!isClickable) return
                      if (isForwarded) setSelectedForwarded(recipient)
                      else setSelectedRecipient(recipient)
                    }}
                    className={`border-b border-slate-100 last:border-0 ${isClickable ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {recipient.profile?.full_name?.split(' ').pop()?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{recipient.profile?.full_name}</div>
                          <div className="text-xs text-slate-500">{recipient.profile?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center space-y-1">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          recipient.status === 'Đã xem' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {recipient.status === 'Đã xem' && <span className="mr-1">✓</span>}
                          {recipient.status}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          recipient.processing_status === 'Chưa xử lý' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          recipient.processing_status === 'Đã trả lời/báo cáo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          recipient.processing_status === 'Đã chuyển tiếp' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          'bg-green-50 text-green-600 border border-green-200'
                        }`}>
                          {recipient.processing_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-500">
                      {recipient.viewed_at ? new Date(recipient.viewed_at).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '--:--'}
                    </td>
                  </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Chưa có người nhận nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end mt-4">
          <button 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-sm transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
    
    {selectedRecipient && documentId && (
      <ReportDetailsModal 
        open={!!selectedRecipient} 
        onOpenChange={(open) => !open && setSelectedRecipient(null)}
        documentId={documentId}
        recipient={selectedRecipient}
      />
    )}

    {selectedForwarded && documentId && (
      <ForwardedDetailsModal 
        open={!!selectedForwarded}
        onOpenChange={(open) => !open && setSelectedForwarded(null)}
        originalDocumentId={documentId}
        forwarderUserId={selectedForwarded.user_id}
        forwarderProfile={selectedForwarded.profile}
      />
    )}
    </>
  )
}
