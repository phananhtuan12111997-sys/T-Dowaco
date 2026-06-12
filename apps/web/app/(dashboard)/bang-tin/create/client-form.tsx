'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createNews } from '../actions'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { X, UploadCloud, File, Image as ImageIcon, Loader2 } from 'lucide-react'

import { useRouter } from 'next/navigation'

export function NewsForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    const formData = new FormData(e.currentTarget)
    const attachments = []

    try {
      // Upload files
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { data, error } = await supabase.storage
          .from('news_attachments')
          .upload(filePath, file)

        if (error) throw error

        const { data: publicUrlData } = supabase.storage
          .from('news_attachments')
          .getPublicUrl(filePath)

        attachments.push({
          name: file.name,
          url: publicUrlData.publicUrl,
          type: file.type
        })
      }

      // Add attachments JSON to formData
      formData.set('attachments', JSON.stringify(attachments))

      // Call server action
      startTransition(async () => {
        try {
          const { editNews } = await import('../actions')
          const res = initialData 
            ? await editNews(initialData.id, formData)
            : await createNews(formData)
            
          if (res?.success) {
            alert(initialData ? 'Cập nhật bài viết thành công!' : 'Đăng bài thành công!')
            router.push('/bang-tin')
          }
        } catch (error: any) {
          if (error.message === 'NEXT_REDIRECT') throw error;
          alert(error.message)
        }
      })
    } catch (error: any) {
      alert('Lỗi upload file: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-slate-700 font-semibold">Tiêu đề tin tức <span className="text-red-500">*</span></Label>
        <Input 
          id="title" 
          name="title" 
          defaultValue={initialData?.title}
          placeholder="Ví dụ: TIN BUỒN, THÔNG BÁO LỊCH NGHỈ TẾT..." 
          required 
          className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-medium uppercase"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content" className="text-slate-700 font-semibold">Nội dung chi tiết <span className="text-red-500">*</span></Label>
        <Textarea 
          id="content" 
          name="content" 
          defaultValue={initialData?.content}
          placeholder="Nhập nội dung đầy đủ của bản tin..." 
          required 
          className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 min-h-[150px]"
        />
      </div>

      <div className="space-y-3 pt-2">
        <Label className="text-slate-700 font-semibold">Đính kèm ảnh và tài liệu</Label>
        
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 bg-slate-50 text-center hover:bg-slate-100 transition-colors">
          <Input 
            type="file" 
            multiple 
            onChange={handleFileChange} 
            className="hidden" 
            id="file-upload" 
          />
          <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium text-slate-700">Nhấn để chọn file</div>
            <div className="text-xs text-slate-500">Hỗ trợ ảnh, PDF, Word, Excel...</div>
          </Label>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {files.map((file, index) => {
              const isImage = file.type.startsWith('image/')
              const objectUrl = isImage ? URL.createObjectURL(file) : null
              return (
                <div key={index} className="relative group border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm flex flex-col">
                  {isImage && objectUrl ? (
                    <div className="aspect-square w-full">
                      <img src={objectUrl} alt={file.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="p-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        <File className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-xs font-medium truncate flex-1" title={file.name}>
                        {file.name}
                      </div>
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 h-6 w-6 bg-slate-900/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
        <Button type="button" variant="outline" asChild className="border-slate-300 text-slate-700">
          <Link href="/bang-tin">Hủy bỏ</Link>
        </Button>
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 px-8" 
          disabled={isPending || uploading}
        >
          {(isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {(isPending || uploading) ? 'Đang đăng...' : 'Đăng bản tin'}
        </Button>
      </div>
    </form>
  )
}
