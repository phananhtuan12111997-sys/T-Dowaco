'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Paperclip, Download, Eye, X, FileText, CheckCircle, Clock } from 'lucide-react'
import { downloadFile } from '@/lib/utils'
import { ReportDetailsModal } from '../report-details-modal'
import { StatusDetailsModal } from '../status-details-modal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface SentDocumentDetailsClientProps {
  document: any
  recipients: any[]
}

export function SentDocumentDetailsClient({ document, recipients }: SentDocumentDetailsClientProps) {
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null)
  const [liveRecipients, setLiveRecipients] = useState(recipients)
  const [liveDocument, setLiveDocument] = useState(document)
  const router = useRouter()
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)

  const readCount = liveRecipients?.filter(r => r.status === 'Đã xem').length || 0
  const totalCount = liveRecipients?.length || 0

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('sent_recipients_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'document_recipients',
          filter: `document_id=eq.${document.id}`
        },
        (payload) => {
          setLiveRecipients((current) => 
            current.map(r => 
              r.id === payload.new.id ? { ...r, ...payload.new } : r
            )
          )
        }
      )
      .subscribe()

    const docChannel = supabase
      .channel('sent_document_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${document.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            router.push('/cong-van/di')
          } else if (payload.eventType === 'UPDATE') {
            setLiveDocument((current: any) => ({ ...current, ...payload.new }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(docChannel)
    }
  }, [document.id, router])

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Công văn đã gửi</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Chi tiết công văn</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="w-full md:w-auto bg-slate-50 hover:bg-slate-100" asChild>
            <Link href="/cong-van/di">
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Cột trái: Nội dung văn bản */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm bg-white overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-[#1a56db] text-white p-4">
              <CardTitle className="text-base font-semibold">Nội dung văn bản</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Loại văn bản</Label>
                  <div className="min-h-10 px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 flex items-center">
                    {liveDocument.type || 'Chưa phân loại'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Số ký hiệu</Label>
                  <div className="min-h-10 px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 flex items-center">
                    {liveDocument.symbol_number || 'Không có'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Độ ưu tiên</Label>
                  <div className="min-h-10 px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 flex items-center">
                    {liveDocument.priority ? "Quan trọng" : "Bình thường"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Trích yếu</Label>
                <div className="min-h-10 px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 flex items-center">
                  {liveDocument.summary}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Nội dung chi tiết</Label>
                <div className="min-h-[150px] px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {liveDocument.content || <span className="text-slate-400 italic">Không có nội dung chi tiết</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#1a56db] font-medium flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Tệp đính kèm
                </Label>
                <div className="flex flex-col gap-2 border rounded-md p-3 border-slate-200 bg-slate-50/50">
                  {liveDocument.attachments && Array.isArray(liveDocument.attachments) && liveDocument.attachments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {liveDocument.attachments.map((att: any, idx: number) => {
                        const isPdf = att.name.toLowerCase().endsWith('.pdf')
                        const isPreviewing = previewFile?.url === att.url
                        
                        return (
                          <div key={idx} className="flex flex-col gap-2">
                            <div 
                              className={`flex items-center justify-between bg-white border p-2 rounded-md cursor-pointer transition-all ${
                                isPreviewing 
                                  ? 'border-blue-300 ring-1 ring-blue-300' 
                                  : 'border-slate-200 hover:border-blue-300'
                              }`}
                              onClick={() => setPreviewFile({ url: att.url, name: att.name })}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold text-[10px] text-white ${isPdf ? 'bg-red-500' : 'bg-[#1a56db]'}`}>
                                  {isPdf ? 'PDF' : 'FILE'}
                                </div>
                                <div className="truncate">
                                  <div className="text-sm text-slate-700 truncate">
                                    {att.name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {att.size ? `${(att.size / 1024).toFixed(0)} KB` : 'Không rõ dung lượng'}
                                  </div>
                                </div>
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-[#1a56db] shrink-0" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile(att.url, att.name);
                                }}
                                title="Tải xuống"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {/* Inline Preview Section for this file */}
                            {isPreviewing && (
                              <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white animate-in fade-in zoom-in-95 duration-200 mt-1 mb-2">
                                <div className="bg-slate-50 flex items-center justify-between p-3 border-b border-slate-200">
                                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                                    <FileText className="w-4 h-4 text-slate-500" /> Xem trước: {previewFile?.name}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewFile(null);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                                  <div className="w-full h-[600px] bg-slate-100 relative">
                                    {previewFile?.url?.toLowerCase().endsWith('.pdf') ? (
                                      <iframe 
                                        src={`${previewFile?.url}#toolbar=0`} 
                                        className="w-full h-full border-0 absolute inset-0" 
                                      />
                                    ) : previewFile?.url?.toLowerCase().match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i) ? (
                                      <iframe 
                                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile?.url || '')}`}
                                        className="w-full h-full border-0 absolute inset-0"
                                        title="Office Preview"
                                      />
                                    ) : previewFile?.url?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                      <div className="w-full h-full flex items-center justify-center p-4">
                                        <img 
                                          src={previewFile?.url} 
                                          alt={previewFile?.name} 
                                          className="max-w-full max-h-full object-contain" 
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                        <FileText className="w-12 h-12 mb-3 text-slate-300" />
                                        <p className="font-medium text-slate-600">Không thể xem trước tệp này</p>
                                        <p className="text-sm text-slate-400 mt-1">Vui lòng tải xuống để xem nội dung</p>
                                        <Button variant="outline" className="mt-4 bg-white" onClick={() => downloadFile(previewFile?.url || '', previewFile?.name || '')}>
                                          <Download className="w-4 h-4 mr-2" />
                                          Tải xuống tệp
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic p-4 text-center">
                      Không có tệp đính kèm nào
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Thông tin & Theo dõi */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <Card className="shadow-sm border-slate-200 shrink-0">
            <CardHeader className="bg-[#1a56db] text-white p-4 rounded-t-lg">
              <CardTitle className="text-base font-semibold">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium">Ngày phát hành</div>
                  <div className="text-sm font-medium text-slate-800">
                    {new Date(liveDocument.created_at).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium">Trạng thái xử lý</div>
                  <div className="inline-block border border-[#1a56db]/20 bg-blue-50/50 px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                    <StatusDetailsModal 
                      readCount={readCount} 
                      totalCount={totalCount} 
                      recipients={liveRecipients} 
                      documentId={document.id} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 flex-grow flex flex-col overflow-hidden">
            <CardHeader className="bg-[#1a56db] text-white p-4 rounded-t-lg flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Theo dõi nhận & xử lý</CardTitle>
              <span className="text-xs font-semibold text-[#1a56db] bg-white px-2 py-1 rounded-md">{liveRecipients?.length || 0} người</span>
            </CardHeader>
            <CardContent className="pt-4 flex-grow overflow-hidden flex flex-col">
              {liveRecipients && liveRecipients.length > 0 ? (
                <div className="overflow-y-auto pr-2 flex-grow h-0 space-y-2">
                    {liveRecipients.map((r) => {
                      const isClickable = r.processing_status && r.processing_status !== 'Chưa xử lý'
                      return (
                      <div 
                        key={r.id} 
                        onClick={() => isClickable && setSelectedRecipient(r)}
                        className={`flex flex-col border p-3 rounded-md ${
                          isClickable 
                            ? 'bg-blue-50/50 border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors' 
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="font-medium text-slate-800 text-sm pr-2">
                            {r.profile?.full_name || 'Người dùng ẩn'}
                          </div>
                          <div className={`text-[10px] font-bold tracking-wider shrink-0 mt-0.5 ${r.status === 'Đã xem' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {r.status?.toUpperCase() || 'CHƯA XEM'}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          {[r.profile?.department, r.profile?.role].filter(Boolean).join(' - ') || 'Chưa có phòng ban'}
                        </div>
                        
                        <div className="flex justify-between items-end mt-1 pt-2 border-t border-slate-200">
                          <div className="text-xs text-slate-600">
                            Trạng thái: <span className={`font-medium ${
                              r.processing_status === 'Hoàn thành' ? 'text-emerald-600' :
                              r.processing_status === 'Đã trả lời/báo cáo' ? 'text-blue-600' :
                              r.processing_status === 'Đã chuyển tiếp' ? 'text-purple-600' :
                              'text-slate-600'
                            }`}>{r.processing_status || 'Chưa xử lý'}</span>
                          </div>
                          {r.viewed_at && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              {new Date(r.viewed_at).toLocaleString('vi-VN', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                              }).replace(',', '')}
                            </div>
                          )}
                        </div>
                      </div>
                      )
                    })}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-slate-500">Không có người nhận nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedRecipient && (
        <ReportDetailsModal 
          open={!!selectedRecipient} 
          onOpenChange={(open) => !open && setSelectedRecipient(null)}
          documentId={document.id}
          recipient={selectedRecipient}
        />
      )}
    </>
  )
}
