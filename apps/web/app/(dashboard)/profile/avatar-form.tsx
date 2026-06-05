'use client'

import { useState, useRef } from 'react'
import { updateAvatar } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, User, Camera, Upload } from 'lucide-react'

export function AvatarForm({ profile }: { profile: any }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('File ảnh vượt quá 3MB')
        return
      }
      setError(null)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const avatarFile = formData.get('avatar') as File
    if (!avatarFile || avatarFile.size === 0) {
      setError('Vui lòng chọn ảnh')
      setLoading(false)
      return
    }
    
    try {
      await updateAvatar(formData)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const displayUrl = previewUrl || profile?.avatar_url

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>Thay đổi ảnh đại diện của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded">Cập nhật ảnh thành công!</div>}
          
          <div className="flex flex-col items-center gap-6">
            {/* Avatar Image (Clickable) */}
            <div 
              className="relative h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-4 border-white shadow-lg overflow-hidden cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {displayUrl ? (
                <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={50} />
              )}
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            
            {/* Custom Upload Button */}
            <div className="w-full space-y-3 text-center">
              <input 
                ref={fileInputRef}
                id="avatar" 
                name="avatar" 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={handleFileChange}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAvatarClick}
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Upload className="mr-2 h-4 w-4" />
                Chọn ảnh từ máy tính
              </Button>
              <p className="text-xs text-slate-500">Hỗ trợ JPG, PNG. Kích thước tối đa 3MB.</p>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu ảnh đại diện
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
