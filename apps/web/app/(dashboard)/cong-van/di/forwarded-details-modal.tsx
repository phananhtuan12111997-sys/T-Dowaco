'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Badge } from '@/components/ui/badge'

interface ForwardedDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalDocumentId: string
  forwarderUserId: string
  forwarderProfile: any
}

export function ForwardedDetailsModal({ open, onOpenChange, originalDocumentId, forwarderUserId, forwarderProfile }: ForwardedDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [downstreamDoc, setDownstreamDoc] = useState<any>(null)
  const [downstreamRecipients, setDownstreamRecipients] = useState<any[]>([])

  useEffect(() => {
    if (open && originalDocumentId && forwarderUserId) {
      setLoading(true)
      const fetchForwarded = async () => {
        const supabase = createClient()
        
        // Find the document that this user created by forwarding from the original document
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('id, summary, created_at')
          .eq('forwarded_from_id', originalDocumentId)
          .eq('created_by', forwarderUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (docData) {
          setDownstreamDoc(docData)
          
          // Get the recipients of that downstream document
          const { data: recData } = await supabase
            .from('document_recipients')
            .select(`
              id, status, processing_status,
              profiles:user_id (id, full_name, department, avatar_url)
            `)
            .eq('document_id', docData.id)
            
          if (recData) {
            setDownstreamRecipients(recData)
          }
        }
        setLoading(false)
      }
      
      fetchForwarded()
    } else {
      setDownstreamDoc(null)
      setDownstreamRecipients([])
    }
  }, [open, originalDocumentId, forwarderUserId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="flex flex-row items-center gap-3 border-b pb-4">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 -ml-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <DialogTitle>Chi tiết người được chuyển tiếp xử lý</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto pr-2 py-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : downstreamDoc ? (
            <>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 overflow-hidden shrink-0">
                  {forwarderProfile?.avatar_url ? (
                    <img src={forwarderProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    forwarderProfile?.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{forwarderProfile?.full_name} đã chuyển tiếp</p>
                  <p className="text-xs text-slate-500">
                    Vào lúc: {new Date(downstreamDoc.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Danh sách người nhận chuyển tiếp:</h4>
                <div className="space-y-2">
                  {downstreamRecipients.length > 0 ? (
                    downstreamRecipients.map((r) => (
                      <div key={r.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 overflow-hidden shrink-0">
                            {r.profiles?.avatar_url ? (
                              <img src={r.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              r.profiles?.full_name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{r.profiles?.full_name || 'Người dùng'}</p>
                            <p className="text-xs text-slate-500">{r.profiles?.department || 'Chưa có phòng ban'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
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
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg text-center border border-slate-100">
                      Không có thông tin người nhận.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-8 text-slate-500">
              Không tìm thấy thông tin chuyển tiếp.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
