'use client'

import { useState, useEffect } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Load saved credentials if any
    const savedUser = localStorage.getItem('tdowaco_username')
    const savedPass = localStorage.getItem('tdowaco_password')
    if (savedUser && savedPass) {
      setUsername(savedUser)
      setPassword(savedPass)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    
    if (rememberMe) {
      localStorage.setItem('tdowaco_username', username)
      localStorage.setItem('tdowaco_password', password)
    } else {
      localStorage.removeItem('tdowaco_username')
      localStorage.removeItem('tdowaco_password')
    }

    const nextPath = new URLSearchParams(window.location.search).get('next')
    if (nextPath) {
      formData.append('next', nextPath)
    }

    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-[500px] shadow-lg border-slate-200">
        <CardHeader className="flex flex-col items-center space-y-4 text-center bg-blue-700 text-white rounded-t-xl mb-6 pb-8 pt-6 px-2">
          <div className="w-32 h-32 bg-white rounded-full p-2 flex items-center justify-center shadow-md">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-base sm:text-lg md:text-[20px] font-bold tracking-wide whitespace-nowrap">CÔNG TY CỔ PHẦN CẤP NƯỚC LONG KHÁNH</CardTitle>
          <CardDescription className="text-blue-100 font-medium text-sm mt-1">
            Hệ thống Văn phòng điện tử
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tài khoản</Label>
              <Input 
                id="username" 
                name="username" 
                type="text" 
                placeholder="Nhập tên đăng nhập" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1 pb-1">
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" 
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-slate-600">Ghi nhớ đăng nhập</Label>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-2" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 pt-4 mt-2">
          <p className="text-sm text-slate-500 text-center cursor-pointer hover:underline" onClick={() => alert('Vui lòng liên hệ Admin để được cấp lại mật khẩu.')}>
            Quên mật khẩu?
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
