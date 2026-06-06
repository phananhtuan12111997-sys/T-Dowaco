import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default async function CreateDocumentPage() {
  const supabase = await createClient()
  
  async function createDocument(formData: FormData) {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const symbol_number = formData.get('symbol_number') as string
    const summary = formData.get('summary') as string
    const sender_name = formData.get('sender_name') as string
    const type = formData.get('type') as string
    const priority = formData.get('priority') === 'on'

    const { error } = await supabase
      .from('documents')
      .insert([
        {
          symbol_number,
          summary,
          sender_name,
          type,
          priority,
          status: 'Chưa xử lý',
          created_by: user.id
        }
      ])

    if (!error) {
      redirect('/documents/incoming')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/documents/incoming">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>T-Dowaco</span>
            <span>→</span>
            <span>Công văn đến</span>
            <span>→</span>
            <span>Soạn công văn mới</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Thêm Công văn mới</h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createDocument} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="symbol_number">Số ký hiệu <span className="text-red-500">*</span></Label>
                <Input id="symbol_number" name="symbol_number" placeholder="VD: 118/TB-CN" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Loại công văn <span className="text-red-500">*</span></Label>
                <Select name="type" defaultValue="Thông báo">
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Thông báo">Thông báo</SelectItem>
                    <SelectItem value="Quyết định">Quyết định</SelectItem>
                    <SelectItem value="Báo cáo">Báo cáo</SelectItem>
                    <SelectItem value="Tờ trình">Tờ trình</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_name">Người gửi (Cơ quan/Phòng ban) <span className="text-red-500">*</span></Label>
              <Input id="sender_name" name="sender_name" placeholder="VD: Văn phòng Điện tử" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Trích yếu <span className="text-red-500">*</span></Label>
              <Textarea 
                id="summary" 
                name="summary" 
                placeholder="Nhập nội dung trích yếu của công văn..." 
                className="min-h-[100px]"
                required 
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="priority" name="priority" />
              <Label htmlFor="priority" className="font-normal cursor-pointer">Đánh dấu là công văn quan trọng (Ưu tiên)</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/documents/incoming">Hủy</Link>
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">Lưu công văn</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
