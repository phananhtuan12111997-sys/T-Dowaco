'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Users, MessageSquare, Forward, FileText, Download, Eye, X, Paperclip } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RecipientListModal } from './recipient-list-modal'
import { ReplyReportModal } from './reply-report-modal'
import { ReportDetailsModal } from '../../sent/report-details-modal'

interface DocumentDetailsClientProps {
  document: any
  recipients: any[]
  users: any[]
  currentUserId: string
}

export function DocumentDetailsClient({ document, recipients, users, currentUserId }: DocumentDetailsClientProps) {
  const [showRecipients, setShowRecipients] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null)
  const [liveRecipients, setLiveRecipients] = useState(recipients)
  const [liveDocument, setLiveDocument] = useState(document)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('incoming_recipients_changes')
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
      .channel('incoming_document_changes')
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
            router.push('/documents/incoming')
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
            <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" asChild>
              <Link href="/documents/incoming">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <span>T-Dowaco</span>
            <span>→</span>
            <span>Công văn đến</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">Chi tiết công văn</h1>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setShowRecipients(true)}>
            <Users className="w-4 h-4 mr-2" /> Danh sách nhận
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => setShowReport(true)}>
            <MessageSquare className="w-4 h-4 mr-2" /> Trả lời / Báo cáo
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => router.push(`/documents/create?forwardFrom=${liveDocument.id}`)}>
            <Forward className="w-4 h-4 mr-2" /> Chuyển tiếp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Cột trái: Nội dung văn bản */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="border-0 shadow-sm bg-white overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-[#1a56db] text-white p-4">
              <CardTitle className="text-base font-semibold text-white">Nội dung văn bản</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
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
                                asChild 
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer" title="Tải xuống">
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                            
                            {/* Inline Preview Section for this file */}
                            {isPreviewing && previewFile && (
                              <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white animate-in fade-in zoom-in-95 duration-200 mt-1 mb-2">
                                <div className="bg-slate-50 flex items-center justify-between p-3 border-b border-slate-200">
                                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
                                    <Eye className="w-4 h-4 text-slate-500" /> Xem trước: {previewFile?.name}
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
                                        <Button variant="outline" className="mt-4 bg-white" asChild>
                                          <a href={previewFile?.url} download={previewFile?.name} target="_blank" rel="noreferrer">
                                            <Download className="w-4 h-4 mr-2" />
                                            Tải xuống tệp
                                          </a>
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
              <CardTitle className="text-base font-semibold text-white">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium">Người gửi</div>
                  <div className="font-medium text-slate-900">{liveDocument.sender?.full_name || 'Không rõ'}</div>
                  <div className="text-sm text-slate-500">{liveDocument.sender?.department}</div>
                </div>

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
                  {(() => {
                    const currentUserRecipient = liveRecipients.find((r: any) => r.user_id === currentUserId);
                    const status = currentUserRecipient?.processing_status || 'Chưa xử lý';
                    const isClickable = status !== 'Chưa xử lý';
                    const colorClass = 
                      status === 'Chưa xử lý' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-blue-50 text-blue-700 border-blue-200';
                    return (
                      <Badge 
                        className={`${colorClass} text-sm py-0.5 shadow-none rounded ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                        onClick={() => isClickable && setSelectedRecipient(currentUserRecipient)}
                      >
                        {status}
                      </Badge>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white overflow-hidden flex-grow flex flex-col min-h-0">
            <CardHeader className="bg-[#1a56db] text-white p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-white">Theo dõi nhận & xử lý</CardTitle>
              <span className="text-xs font-semibold text-[#1a56db] bg-white px-2 py-1 rounded shadow-sm">{liveRecipients?.length || 0} người</span>
            </CardHeader>
            <CardContent className="pt-6 flex-grow min-h-0">
              {liveRecipients && liveRecipients.length > 0 ? (
                <div className="h-full">
                  <div className="max-h-[400px] h-full overflow-y-auto space-y-2 pr-2">
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

      <RecipientListModal 
        open={showRecipients} 
        onOpenChange={setShowRecipients} 
        recipients={liveRecipients}
        documentId={document.id}
      />
      
      <ReplyReportModal 
        open={showReport} 
        onOpenChange={setShowReport} 
        documentId={document.id}
      />
      
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
