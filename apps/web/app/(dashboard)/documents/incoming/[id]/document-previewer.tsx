'use client'

import { X, Printer, Download, Maximize } from 'lucide-react'

interface DocumentPreviewerProps {
  url: string
  name: string
  open: boolean
  onClose: () => void
}

export function DocumentPreviewer({ url, name, open, onClose }: DocumentPreviewerProps) {
  if (!open) return null

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print()
    } else {
      window.open(url, '_blank')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
  }

  const isPDF = name.toLowerCase().endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs font-bold uppercase border border-red-500/30">
            {isPDF ? 'PDF' : 'FILE'}
          </div>
          <span className="text-white font-medium truncate max-w-[300px] md:max-w-md">
            {name}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="In tài liệu"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Tải xuống"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors hidden md:block"
            title="Toàn màn hình"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-slate-700 mx-2"></div>
          <button 
            onClick={onClose}
            className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-md transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="w-full h-full max-w-5xl bg-white shadow-2xl rounded-sm overflow-hidden">
          {isPDF ? (
            <iframe 
              id="pdf-preview-iframe"
              src={`${url}#toolbar=0`} 
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 overflow-auto">
              <img src={url} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
