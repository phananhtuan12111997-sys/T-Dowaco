'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Send, Upload } from 'lucide-react'
import { submitReport } from './actions'

interface ReplyReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
}

export function ReplyReportModal({ open, onOpenChange, documentId }: ReplyReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setError(null)
    
    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      const validFiles: File[] = []
      
      let hasError = false
      newFiles.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          setError('Một hoặc nhiều file vượt quá dung lượng tối đa 10MB')
          hasError = true
        } else {
          validFiles.push(file)
        }
      })
      
      setSelectedFiles(prev => [...prev, ...validFiles])
      
      if (hasError) {
        e.target.value = ''
      }
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('document_id', documentId)
    formData.delete('file')
    selectedFiles.forEach(file => {
      formData.append('attachments', file)
    })
    
    try {
      const result = await submitReport(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        alert('Gửi báo cáo thành công!')
        onOpenChange(false)
      }
    } catch (err) {
      setError('Đã xảy ra lỗi, vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-emerald-500">
            Gửi báo cáo xử lý văn bản
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Nội dung báo cáo <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              required
              className="w-full min-h-[100px] p-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              placeholder="Nhập kết quả xử lý..."
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Vướng mắc (nếu có)
            </label>
            <textarea
              name="issues"
              className="w-full min-h-[80px] p-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              placeholder="Nhập các khó khăn, vướng mắc..."
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Tệp đính kèm báo cáo
            </label>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center justify-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-100 whitespace-nowrap self-start">
                <span className="text-sm text-slate-600">Chọn tệp</span>
                <input 
                  type="file" 
                  name="file"
                  multiple
                  className="hidden" 
                  accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileChange}
                />
              </label>
              
              {selectedFiles.length > 0 ? (
                <div className="flex flex-col gap-2 mt-2">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-md">
                      <span className="text-sm text-slate-700 truncate">{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <button 
                        type="button" 
                        onClick={() => removeFile(i)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <span className="sr-only">Xoá</span>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm text-slate-500">
                  Không có tệp nào được chọn
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Định dạng: PDF, Ảnh, Word, Excel, PPT (Max 10MB/file)
            </div>
            {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-medium text-sm transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
