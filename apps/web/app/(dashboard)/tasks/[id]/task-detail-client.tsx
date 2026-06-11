'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, AlertCircle, FileText, CheckCircle2, MessageSquare, Send, CornerUpRight, XCircle, Download, Eye, X, Paperclip, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { acceptTask, reportTask, forwardTask, approveTask, rejectTask, addComment, getForwardableUsers } from '../workflow-actions'

export function TaskDetailClient({ 
  task, 
  recipients, 
  comments, 
  currentUserId, 
  isAssigner, 
  currentUserRecipient 
}: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Modals state
  const [showReportModal, setShowReportModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showGlobalApproveModal, setShowGlobalApproveModal] = useState(false)
  const [showApproveReportModal, setShowApproveReportModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null)
  const [reportContent, setReportContent] = useState('')
  const [forwardNote, setForwardNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [selectedForwardUsers, setSelectedForwardUsers] = useState<string[]>([])
  const [forwardableUsers, setForwardableUsers] = useState<any[]>([])
  
  // Quick comment
  const [commentText, setCommentText] = useState('')
  const [commentFiles, setCommentFiles] = useState<File[]>([])
  const [reportFiles, setReportFiles] = useState<File[]>([])
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(5)

  // Selected recipient for approve/reject
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null)
  const [selectedRecipientName, setSelectedRecipientName] = useState<string>('')

  // Loading state
  const [isPending, startTransition] = useTransition()
  const [isActionLoadingState, setIsActionLoading] = useState(false)
  const isActionLoading = isActionLoadingState || isPending

  useEffect(() => {
    if (showForwardModal && forwardableUsers.length === 0) {
      getForwardableUsers().then(setForwardableUsers)
    }
  }, [showForwardModal])

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'approve' && isAssigner) {
      setShowGlobalApproveModal(true)
    } else if (action === 'comment') {
      setTimeout(() => {
        const el = document.getElementById('comments-section')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
  }, [searchParams, isAssigner])

  // Real-time updates are handled by global RealtimeListener
  
  const handleAccept = async () => {
    if (!currentUserRecipient) return
    setIsActionLoading(true)
    try {
      await acceptTask(task.id)
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReport = async () => {
    if (!reportContent.trim() && reportFiles.length === 0) return alert('Vui lòng nhập nội dung báo cáo hoặc đính kèm tệp')
    setIsActionLoading(true)
    try {
      const formData = new FormData()
      formData.append('taskId', task.id)
      formData.append('content', reportContent)
      reportFiles.forEach(file => formData.append('attachments', file))

      await reportTask(formData)
      setShowReportModal(false)
      setReportContent('')
      setReportFiles([])
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleForward = async () => {
    if (selectedForwardUsers.length === 0) return alert('Vui lòng chọn người nhận')
    setIsActionLoading(true)
    try {
      await forwardTask(task.id, selectedForwardUsers, forwardNote)
      setShowForwardModal(false)
      setSelectedForwardUsers([])
      setForwardNote('')
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleApprove = async (recipientId: string, recipientName: string) => {
    if (confirm(`Bạn có chắc chắn duyệt hoàn thành cho ${recipientName}?`)) {
      setIsActionLoading(true)
      try {
        await approveTask(task.id, recipientId, recipientName)
        startTransition(() => {
          router.refresh()
        })
      } finally {
        setIsActionLoading(false)
      }
    }
  }

  const openRejectModal = (recipientId: string, recipientName: string) => {
    setSelectedRecipientId(recipientId)
    setSelectedRecipientName(recipientName)
    setShowRejectModal(true)
  }

  const openApproveReportModal = (recipientId: string, recipientName: string) => {
    setSelectedRecipientId(recipientId)
    setSelectedRecipientName(recipientName)
    const report = comments
      .filter((c: any) => c.user_id === recipientId && c.type === 'report')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    setSelectedReport(report)
    setShowApproveReportModal(true)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert('Vui lòng nhập lý do trả về')
    if (selectedRecipientId) {
      setIsActionLoading(true)
      try {
        await rejectTask(task.id, selectedRecipientId, selectedRecipientName, rejectReason)
        setShowRejectModal(false)
        setRejectReason('')
        setSelectedRecipientId(null)
        startTransition(() => {
          router.refresh()
        })
      } finally {
        setIsActionLoading(false)
      }
    }
  }

  const handleSendComment = async () => {
    if (!commentText.trim() && commentFiles.length === 0) return
    setIsActionLoading(true)
    try {
      const formData = new FormData()
      formData.append('taskId', task.id)
      formData.append('content', commentText)
      commentFiles.forEach(file => formData.append('attachments', file))
      
      await addComment(formData)
      setCommentText('')
      setCommentFiles([])
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const toggleForwardUser = (id: string) => {
    setSelectedForwardUsers(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    )
  }

  const pendingReports = recipients?.filter((r: any) => {
    if (r.processing_status !== 'Chờ duyệt' || r.user_id === currentUserId) return false;
    if (r.forwarded_from === currentUserId) return true;
    if (isAssigner && !r.forwarded_from) return true;
    return false;
  }) || []

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" asChild>
              <Link href={searchParams?.get('from') === 'sent' ? '/tasks/sent' : '/tasks/incoming'}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <span>LKWA</span>
            <span>→</span>
            <span>Quản lý công việc</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a56db]">
            {searchParams?.get('from') === 'sent' ? 'Chi tiết công việc đã giao' : 
             searchParams?.get('from') === 'incoming' ? 'Chi tiết công việc đã nhận' : 
             'Chi tiết công việc'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {(isAssigner || recipients?.some((r: any) => r.forwarded_from === currentUserId)) && (
            <Button onClick={() => setShowGlobalApproveModal(true)} className="flex-1 md:flex-none text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white shadow-sm" variant="outline">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Duyệt báo cáo
            </Button>
          )}
          {currentUserRecipient && currentUserRecipient.processing_status === 'Chưa xử lý' && (
            <Button onClick={handleAccept} disabled={isActionLoading} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700">
              {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Tiếp nhận
            </Button>
          )}

          {currentUserRecipient && (currentUserRecipient.processing_status === 'Đang thực hiện' || currentUserRecipient.processing_status === 'Chờ duyệt' || currentUserRecipient.processing_status === 'Trả về' || currentUserRecipient.processing_status === 'Đã chuyển tiếp') && (
            <>
              <Button onClick={() => setShowReportModal(true)} variant="outline" className="flex-1 md:flex-none text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <MessageSquare className="w-4 h-4 mr-2" /> Báo cáo
              </Button>
              {currentUserRecipient.processing_status !== 'Đã chuyển tiếp' && (
                <Button onClick={() => setShowForwardModal(true)} variant="outline" className="flex-1 md:flex-none text-blue-600 border-blue-200 hover:bg-blue-50">
                  <CornerUpRight className="w-4 h-4 mr-2" /> Chuyển tiếp
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Cột trái: Nội dung */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          <Card className="border-0 shadow-sm bg-white overflow-hidden flex-none">
            <CardHeader className="bg-[#1a56db] text-white p-4">
              <CardTitle className="text-base font-semibold text-white">Nội dung công việc</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Tiêu đề</Label>
                <div className="min-h-10 px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 font-bold flex items-center">
                  {task.title}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Người giao</Label>
                  <div className="min-h-10 px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 flex items-center">
                    {task.assigner_name} ({task.assigner_role})
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Độ ưu tiên</Label>
                  <div className="min-h-10 px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 flex items-center">
                    {task.priority || 'Bình thường'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Nội dung chi tiết</Label>
                <div className="min-h-[150px] px-3 py-2 border rounded-md border-slate-200 bg-slate-50 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {task.description || <span className="text-slate-400 italic">Không có nội dung chi tiết</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#1a56db] font-medium flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Tệp đính kèm
                </Label>
                <div className="flex flex-col gap-2 border rounded-md p-3 border-slate-200 bg-slate-50/50">
                  {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {task.attachments.map((file: any, index: number) => {
                        const isPdf = file.name.toLowerCase().endsWith('.pdf')
                        const isPreviewing = previewFile?.url === file.url
                        
                        return (
                          <div key={index} className="flex flex-col gap-2">
                            <div 
                              className={`flex items-center justify-between bg-white border p-2 rounded-md cursor-pointer transition-all ${
                                isPreviewing 
                                  ? 'border-blue-300 ring-1 ring-blue-300' 
                                  : 'border-slate-200 hover:border-blue-300'
                              }`}
                              onClick={() => setPreviewFile({ url: file.url, name: file.name })}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold text-[10px] text-white ${isPdf ? 'bg-red-500' : 'bg-[#1a56db]'}`}>
                                  {isPdf ? 'PDF' : 'FILE'}
                                </div>
                                <div className="truncate">
                                  <div className="text-sm font-medium text-slate-700 truncate group-hover:underline">
                                    {file.name || 'File đính kèm'}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {file.size ? `${(file.size / 1024).toFixed(0)} KB` : 'Không rõ dung lượng'}
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
                                <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer" title="Tải xuống">
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                            
                            {/* Inline Preview */}
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

          <Card id="comments-section" className="border-0 shadow-sm bg-white overflow-hidden flex-none">
            <CardHeader className="bg-[#1a56db] text-white p-4">
              <CardTitle className="text-base font-semibold text-white">Tiến trình xử lý & Trao đổi</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {comments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Chưa có lịch sử xử lý.</p>
              ) : (
                <div className="space-y-4">
                  {[...comments]
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, visibleCommentsCount)
                    .map((comment: any) => {
                    let text = comment.content || '';
                    let attachments: any[] = [];
                    if (text.includes(':::ATTACHMENTS:::')) {
                      const parts = text.split(':::ATTACHMENTS:::');
                      text = parts[0];
                      try {
                        attachments = JSON.parse(parts[1]);
                      } catch(e){}
                    }

                    return (
                    <div key={comment.id} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-500">
                        {comment.user_avatar ? (
                          <img src={comment.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : comment.user_name.charAt(0)}
                      </div>
                      <div className={`flex-1 rounded-lg p-4 ${
                        comment.type === 'report' ? 'bg-blue-50 border border-blue-100' :
                        comment.type === 'reject' ? 'bg-red-50 border border-red-100' :
                        ['approve', 'accept', 'forward'].includes(comment.type) ? 'bg-emerald-50 border border-emerald-100' :
                        'bg-slate-50 border border-slate-100'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm">{comment.user_name}</span>
                          <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        {comment.type === 'report' && (
                          <div className="text-sm font-semibold text-blue-700 mb-2 pb-1 border-b border-blue-200/60 flex items-center gap-1 w-fit">
                            <FileText className="w-4 h-4" /> Báo cáo tiến độ
                          </div>
                        )}
                        {comment.type === 'reject' && (
                          <div className="text-sm font-semibold text-red-700 mb-2 pb-1 border-b border-red-200/60 flex items-center gap-1 w-fit">
                            <XCircle className="w-4 h-4" /> Từ chối / Yêu cầu làm lại
                          </div>
                        )}
                        {comment.type === 'approve' && (
                          <div className="text-sm font-semibold text-emerald-700 mb-2 pb-1 border-b border-emerald-200/60 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-4 h-4" /> Duyệt hoàn thành
                          </div>
                        )}
                        {comment.type === 'accept' && (
                          <div className="text-sm font-semibold text-emerald-700 mb-2 pb-1 border-b border-emerald-200/60 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-4 h-4" /> Tiếp nhận công việc
                          </div>
                        )}
                        {comment.type === 'forward' && (
                          <div className="text-sm font-semibold text-emerald-700 mb-2 pb-1 border-b border-emerald-200/60 flex items-center gap-1 w-fit">
                            <CornerUpRight className="w-4 h-4" /> Chuyển tiếp công việc
                          </div>
                        )}
                        
                        <div className={`text-sm whitespace-pre-wrap ${
                          ['accept', 'approve', 'forward'].includes(comment.type) ? 'text-emerald-800' :
                          comment.type === 'report' ? 'text-blue-800' :
                          comment.type === 'reject' ? 'text-red-800' :
                          'text-slate-700 mt-1'
                        }`}>{text}</div>
                        {attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {attachments.map((file, i) => (
                              <a 
                                key={i} 
                                href={file.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors max-w-full"
                              >
                                {file.type?.startsWith('image/') ? (
                                  <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                                ) : (
                                  <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                                )}
                                <span className="text-xs font-medium text-slate-700 truncate">{file.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                  
                  {visibleCommentsCount < comments.length && (
                    <div className="flex justify-center pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setVisibleCommentsCount(prev => prev + 5)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Xem thêm bình luận
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                {commentFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {commentFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs">
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        <X className="w-3 h-3 cursor-pointer text-slate-500 hover:text-red-500" onClick={() => setCommentFiles(prev => prev.filter((_, idx) => idx !== i))} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nhập nội dung trao đổi..." 
                    className="flex-1 p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  />
                  <input 
                    id="comment-file-upload"
                    type="file" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const filesArray = Array.from(e.target.files);
                        setCommentFiles(prev => [...prev, ...filesArray]);
                      }
                      e.target.value = '';
                    }} 
                  />
                  <label htmlFor="comment-file-upload" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center w-10 h-10 rounded">
                    <Paperclip className="w-4 h-4" />
                  </label>
                  <Button onClick={handleSendComment} disabled={isActionLoading} className="bg-blue-600 hover:bg-blue-700">
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Thông tin & Theo dõi */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <Card className="shadow-sm border-slate-200 shrink-0">
            <CardHeader className="bg-[#1a56db] text-white p-4 rounded-t-lg">
              <CardTitle className="text-base font-semibold text-white">Thông tin xử lý</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium">Thời hạn hoàn thành</div>
                  <div className="text-sm font-medium text-slate-800 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Không có'}
                  </div>
                </div>

                {currentUserRecipient && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1 font-medium">Trạng thái của bạn</div>
                    <Badge className={`text-sm py-0.5 shadow-none rounded ${
                      currentUserRecipient.processing_status === 'Chưa xử lý' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      currentUserRecipient.processing_status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {currentUserRecipient.processing_status}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white overflow-hidden flex-grow flex flex-col min-h-0">
            <CardHeader className="bg-[#1a56db] text-white p-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-white">Theo dõi nhận & xử lý</CardTitle>
              <span className="text-xs font-semibold text-[#1a56db] bg-white px-2 py-1 rounded shadow-sm">{recipients?.length || 0} người</span>
            </CardHeader>
            <CardContent className="pt-6 flex-grow min-h-0">
              {recipients && recipients.length > 0 ? (
                <div className="h-full">
                  <div className="max-h-[400px] h-full overflow-y-auto space-y-2 pr-2">
                    {recipients.map((r: any) => (
                      <div 
                        key={r.id} 
                        className="flex flex-col border p-3 rounded-md bg-slate-50 border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-500 text-lg">
                            {r.user_avatar ? (
                              <img src={r.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : r.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 text-sm truncate pr-2">
                              {r.user_name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate">
                              {r.user_role}
                              {r.forwarded_from_name && <span className="ml-1 text-blue-500">
                                (Từ: {r.forwarded_from_name})
                              </span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col mt-1 pt-2 border-t border-slate-200">
                          <div className="flex justify-between items-end">
                            <div className="text-xs text-slate-600">
                              Trạng thái: <span className={`font-medium ${
                                r.processing_status === 'Hoàn thành' || r.processing_status === 'Đã hoàn thành' ? 'text-emerald-600' :
                                r.processing_status === 'Đã trả lời/báo cáo' ? 'text-blue-600' :
                                r.processing_status === 'Đã chuyển tiếp' ? 'text-purple-600' :
                                'text-slate-600'
                              }`}>{r.processing_status || 'Chưa xử lý'}</span>
                            </div>
                          </div>
                          {r.processing_status === 'Đã chuyển tiếp' && (
                            <div className="text-xs text-purple-600 mt-1">
                              Cho: {recipients.filter((x: any) => x.forwarded_from === r.user_id).map((x: any) => x.user_name).join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Phê duyệt / Trả về actions */}
                        {(isAssigner || r.forwarded_from === currentUserId) && r.processing_status === 'Chờ duyệt' && r.user_id !== currentUserId && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200">
                            <Button size="sm" onClick={() => openApproveReportModal(r.user_id, r.user_name)} className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 text-[11px]" variant="outline">
                              <MessageSquare className="w-3 h-3 mr-1" /> Duyệt báo cáo
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
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

      {/* Modals */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Báo cáo kết quả</h3>
            <textarea 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[150px] mb-4"
              placeholder="Nhập nội dung báo cáo tiến độ / kết quả..."
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
            />
            {reportFiles.length > 0 && (
              <div className="flex flex-col gap-2 mb-4 border rounded p-2 bg-slate-50">
                {reportFiles.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-white p-2 border rounded">
                    <span className="truncate">{f.name}</span>
                    <X className="w-4 h-4 cursor-pointer text-red-500" onClick={() => setReportFiles(prev => prev.filter((_, idx) => idx !== i))} />
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center gap-3">
              <input 
                id="report-file-upload"
                type="file" 
                multiple 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const filesArray = Array.from(e.target.files);
                    setReportFiles(prev => [...prev, ...filesArray]);
                  }
                  e.target.value = '';
                }} 
              />
              <label 
                htmlFor="report-file-upload" 
                className="cursor-pointer flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Paperclip className="w-4 h-4" /> Đính kèm tệp
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowReportModal(false)}>Hủy</Button>
                <Button onClick={handleReport} disabled={isActionLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Gửi báo cáo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForwardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold mb-4">Chuyển tiếp công việc</h3>
            <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 border border-slate-200 rounded p-2">
              {forwardableUsers.length === 0 ? (
                <div className="text-center text-slate-500 py-8">Bạn không có nhân viên cấp dưới để chuyển tiếp.</div>
              ) : (
                forwardableUsers.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedForwardUsers.includes(u.id)}
                      onChange={() => toggleForwardUser(u.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <div className="font-medium text-sm">{u.full_name}</div>
                      <div className="text-xs text-slate-500">{u.role} - {u.department}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <textarea 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4 h-24"
              placeholder="Lời nhắn chuyển tiếp (Không bắt buộc)..."
              value={forwardNote}
              onChange={(e) => setForwardNote(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForwardModal(false)}>Hủy</Button>
              <Button onClick={handleForward} disabled={isActionLoading || selectedForwardUsers.length === 0} className="bg-blue-600 hover:bg-blue-700">
                {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Chuyển tiếp
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4 text-red-600">Trả về báo cáo của {selectedRecipientName}</h3>
            <textarea 
              className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 min-h-[120px] mb-4"
              placeholder="Lý do trả về yêu cầu làm lại..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>Hủy</Button>
              <Button onClick={handleReject} disabled={isActionLoading} className="bg-red-600 hover:bg-red-700">
                {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Xác nhận trả về
              </Button>
            </div>
          </div>
        </div>
      )}

      {showApproveReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold mb-4">Duyệt báo cáo của {selectedRecipientName}</h3>
            
            <div className="flex-1 overflow-y-auto min-h-[100px] mb-4">
              {selectedReport ? (() => {
                let reportContent = selectedReport.content || '';
                let reportAttachments: any[] = [];
                if (reportContent.includes(':::ATTACHMENTS:::')) {
                  const parts = reportContent.split(':::ATTACHMENTS:::');
                  reportContent = parts[0];
                  try {
                    reportAttachments = JSON.parse(parts[1]);
                  } catch(e){}
                }
                
                return (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="text-sm font-medium text-slate-800 mb-2">Nội dung báo cáo:</div>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap mb-4">{reportContent || <em className="text-slate-400">Không có nội dung</em>}</div>
                  
                  {reportAttachments && reportAttachments.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-2">Tệp đính kèm:</div>
                      <div className="flex flex-col gap-2">
                        {selectedReport.attachments.map((file: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-md">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-sm truncate flex-1">{file.name || 'File đính kèm'}</span>
                            <div className="flex gap-1 shrink-0">
                              {file.url && file.url.match(/\.(jpg|jpeg|png|gif)$/i) && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-blue-600" onClick={() => setPreviewFile(file)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-blue-600" asChild>
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )})() : (
                <div className="mb-6 text-sm text-slate-500 italic text-center p-8 bg-slate-50 rounded-lg border border-slate-200">Không tìm thấy báo cáo chi tiết.</div>
              )}
            </div>

            <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowApproveReportModal(false)}>Đóng</Button>
              <div className="flex gap-2">
                <Button onClick={() => { setShowApproveReportModal(false); openRejectModal(selectedRecipientId!, selectedRecipientName); }} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">Từ chối</Button>
                <Button onClick={() => { setShowApproveReportModal(false); handleApprove(selectedRecipientId!, selectedRecipientName); }} disabled={isActionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                  {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Hoàn thành
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGlobalApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold mb-4">Duyệt báo cáo công việc</h3>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
              {pendingReports.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                  Chưa có báo cáo công việc
                </div>
              ) : (
                pendingReports.map((r: any) => {
                  const report = comments
                    .filter((c: any) => c.user_id === r.user_id && c.type === 'report')
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

                  return (
                    <div key={r.user_id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="font-semibold text-[#1a56db] mb-3 border-b border-slate-200 pb-2">Người báo cáo: {r.user_name}</div>
                      
                      {report ? (() => {
                        let reportContent = report.content || '';
                        let reportAttachments: any[] = [];
                        if (reportContent.includes(':::ATTACHMENTS:::')) {
                          const parts = reportContent.split(':::ATTACHMENTS:::');
                          reportContent = parts[0];
                          try {
                            reportAttachments = JSON.parse(parts[1]);
                          } catch(e){}
                        }
                        return (
                        <>
                          <div className="text-sm font-medium text-slate-800 mb-1">Nội dung báo cáo:</div>
                          <div className="text-sm text-slate-600 whitespace-pre-wrap mb-4">{reportContent || <em className="text-slate-400">Không có nội dung</em>}</div>
                          
                          {reportAttachments && reportAttachments.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs font-medium text-slate-500 mb-2">Tệp đính kèm:</div>
                              <div className="flex flex-col gap-2">
                                {reportAttachments.map((file: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-md">
                                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span className="text-sm truncate flex-1">{file.name || 'File đính kèm'}</span>
                                    <div className="flex gap-1 shrink-0">
                                      {file.url && file.url.match(/\.(jpg|jpeg|png|gif)$/i) && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-blue-600" onClick={() => setPreviewFile(file)}>
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      )}
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-blue-600" asChild>
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                          <Download className="w-4 h-4" />
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )})() : (
                        <div className="text-sm text-slate-500 italic mb-4">Không tìm thấy báo cáo chi tiết.</div>
                      )}
                      
                      <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-200">
                        <Button size="sm" onClick={() => { setShowGlobalApproveModal(false); openRejectModal(r.user_id, r.user_name); }} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                          Từ chối
                        </Button>
                        <Button size="sm" onClick={() => { handleApprove(r.user_id, r.user_name); if (pendingReports.length === 1) setShowGlobalApproveModal(false); }} className="bg-emerald-600 hover:bg-emerald-700">
                          Hoàn thành
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowGlobalApproveModal(false)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
