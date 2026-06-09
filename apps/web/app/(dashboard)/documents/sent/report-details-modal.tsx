'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Download, Forward, CheckCircle, Users } from 'lucide-react'
import { getDocumentReport, completeDocumentProcessing, getForwardedRecipients } from '@/app/actions/report-actions'
import { useRouter } from 'next/navigation'

interface ReportDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  recipient: any
  onComplete?: () => void
}

export function ReportDetailsModal({ open, onOpenChange, documentId, recipient, onComplete }: ReportDetailsModalProps) {
  const [report, setReport] = useState<any>(null)
  const [forwardedRecipients, setForwardedRecipients] = useState<any[]>([])
  const [loadingReport, setLoadingReport] = useState(false)
  const [completing, setCompleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open && recipient && documentId) {
      setLoadingReport(true)
      setReport(null)
      setForwardedRecipients([])
      
      const userId = recipient.user_id || recipient.profile?.id

      if (recipient.processing_status === 'Đã chuyển tiếp') {
        getForwardedRecipients(documentId, userId).then(res => {
          if (res.data) setForwardedRecipients(res.data)
          setLoadingReport(false)
        })
      } else {
        getDocumentReport(documentId, userId).then(res => {
          if (res.data) setReport(res.data)
          setLoadingReport(false)
        })
      }
    } else if (!open) {
      setReport(null)
      setForwardedRecipients([])
    }
  }, [open, recipient, documentId])

  let attachments: any[] = []
  if (report?.attachment_url) {
    try {
      attachments = JSON.parse(report.attachment_url)
    } catch(e) {}
  }

  const handleComplete = async () => {
    if (!documentId || !recipient) return
    setCompleting(true)
    await completeDocumentProcessing(documentId, recipient.user_id || recipient.profile?.id)
    setCompleting(false)
    onOpenChange(false)
    if (onComplete) onComplete()
  }

  const handleForward = () => {
    if (!documentId) return
    router.push(`/documents/create?forwardFrom=${documentId}`)
  }

  const profile = recipient?.profiles || recipient?.profile

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 -ml-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle>
              {recipient?.processing_status === 'Đã chuyển tiếp' ? 'Chi tiết chuyển tiếp' : 'Chi tiết báo cáo'}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto pr-2 py-4 space-y-6">
          {loadingReport ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : recipient?.processing_status === 'Đã chuyển tiếp' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile?.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{profile?.full_name}</p>
                  <p className="text-xs text-slate-500">Người chuyển tiếp</p>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-slate-700 border-b pb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Người nhận chuyển tiếp ({forwardedRecipients.length})
              </h4>
              
              {forwardedRecipients.length > 0 ? (
                <div className="space-y-2">
                  {forwardedRecipients.map((r) => (
                    <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white border border-slate-200 rounded-md gap-2 sm:gap-0">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{r.profile?.full_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {[r.profile?.department, r.profile?.role].filter(Boolean).join(' - ') || 'Chưa có phòng ban'}
                        </div>
                      </div>
                      <div className={`text-[11px] px-2 py-1 rounded font-semibold border ${
                        r.processing_status === 'Hoàn thành' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                        r.processing_status === 'Đã trả lời/báo cáo' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                        r.processing_status === 'Đã chuyển tiếp' ? 'text-purple-600 border-purple-200 bg-purple-50' :
                        'text-slate-600 border-slate-200 bg-slate-50'
                      }`}>
                        {r.processing_status || 'Chưa xử lý'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-slate-500 text-sm border rounded-md border-dashed">
                  Chưa có thông tin người nhận chuyển tiếp.
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
              </div>
            </div>
          ) : report ? (
            <>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile?.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{profile?.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(report.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Nội dung báo cáo</h4>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-md text-sm whitespace-pre-wrap text-slate-700">
                  {report.content}
                </div>
              </div>

              {report.issues && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-600">Vướng mắc</h4>
                  <div className="bg-red-50 border border-red-100 p-4 rounded-md text-sm whitespace-pre-wrap text-red-700">
                    {report.issues}
                  </div>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">Tệp đính kèm ({attachments.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-md">
                        <div className="truncate pr-2">
                          <div className="text-sm font-medium text-slate-700 truncate">{att.name}</div>
                          <div className="text-xs text-slate-500">{att.size ? Math.round(att.size/1024) + ' KB' : ''}</div>
                        </div>
                        <Button variant="ghost" size="icon" asChild className="shrink-0 h-8 w-8">
                          <a href={att.url} download target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                {recipient?.processing_status === 'Hoàn thành' ? (
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Đóng
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Hủy
                    </Button>
                    <Button variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100" onClick={handleForward}>
                      <Forward className="w-4 h-4 mr-2" />
                      Chuyển tiếp
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete} disabled={completing}>
                      {completing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Hoàn thành
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="text-slate-500">
                {recipient?.processing_status === 'Hoàn thành' ? 'Không có báo cáo chi tiết nào cho mục hoàn thành này.' : 'Không có báo cáo.'}
              </div>
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
