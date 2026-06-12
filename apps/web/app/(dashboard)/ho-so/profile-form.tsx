'use client'

import { useState } from 'react'
import { updateProfile } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProfileForm({ profile }: { profile: any }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateProfile(formData)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
        <CardDescription>Cập nhật tên và địa chỉ liên hệ</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded">Cập nhật thông tin thành công!</div>}
          
          <div className="space-y-2">
            <Label htmlFor="full_name">Họ và tên</Label>
            <Input id="full_name" name="full_name" required defaultValue={profile?.full_name} pattern="^[^0-9]+$" title="Không được chứa chữ số" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '') }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" name="phone" defaultValue={profile?.phone} pattern="^[0-9]+$" title="Chỉ được nhập số" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '') }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cccd">CCCD/CMND</Label>
              <Input id="cccd" name="cccd" defaultValue={profile?.cccd} pattern="^[0-9]+$" title="Chỉ được nhập số" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '') }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hometown">Quê quán</Label>
              <Input id="hometown" name="hometown" defaultValue={profile?.hometown} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="social_insurance_number">Số bảo hiểm (BHXH)</Label>
              <Input id="social_insurance_number" name="social_insurance_number" defaultValue={profile?.social_insurance_number} pattern="^[0-9]+$" title="Chỉ được nhập số" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '') }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="health_insurance_number">Số thẻ BHYT</Label>
              <Input id="health_insurance_number" name="health_insurance_number" defaultValue={profile?.health_insurance_number} pattern="^[0-9]+$" title="Chỉ được nhập số" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '') }} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính</Label>
            <Select name="gender" defaultValue={profile?.gender || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nam">Nam</SelectItem>
                <SelectItem value="Nữ">Nữ</SelectItem>
                <SelectItem value="Khác">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email liên hệ</Label>
            <Input id="email" name="email" type="email" defaultValue={profile?.email} pattern=".*@.*" title="Email phải có ký tự @" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" name="address" defaultValue={profile?.address} />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
