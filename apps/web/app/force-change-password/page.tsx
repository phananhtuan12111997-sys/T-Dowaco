'use client'

import { useState } from 'react'
import { changePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ShieldAlert } from 'lucide-react'

export default function ForceChangePasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    const result = await changePassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-orange-200">
        <CardHeader className="space-y-2 text-center bg-orange-50 rounded-t-xl mb-6 pb-6 pt-6 border-b border-orange-100">
          <div className="mx-auto bg-orange-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <ShieldAlert className="text-orange-600" size={32} />
          </div>
          <CardTitle className="text-xl font-bold text-orange-800">Đổi Mật Khẩu Bắt Buộc</CardTitle>
          <CardDescription className="text-orange-700">
            Vì lý do bảo mật, bạn bắt buộc phải thay đổi mật khẩu mặc định trong lần đăng nhập đầu tiên để tiếp tục sử dụng hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Ít nhất 6 ký tự"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                required 
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            <Button className="w-full bg-orange-600 hover:bg-orange-700 mt-4" type="submit" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
