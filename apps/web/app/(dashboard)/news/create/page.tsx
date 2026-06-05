import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createNews } from '../actions'
import Link from 'next/link'

export default function CreateNewsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <span>T-Dowaco</span>
        <span>→</span>
        <Link href="/news" className="hover:text-[#1a56db]">Bảng tin nội bộ</Link>
        <span>→</span>
        <span>Đăng tin mới</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-[#1a56db]">Đăng tin công ty mới</h2>
          <p className="text-sm text-slate-500 mt-1">Soạn thông báo, tin tức để gửi tới toàn thể nhân viên</p>
        </div>
        
        <div className="p-6">
          <form action={createNews} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-700 font-semibold">Tiêu đề tin tức <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                name="title" 
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
                placeholder="Nhập nội dung đầy đủ của bản tin..." 
                required 
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="author_name" className="text-slate-700 font-semibold">Người đăng (Tên hiển thị)</Label>
                <Input 
                  id="author_name" 
                  name="author_name" 
                  placeholder="Ví dụ: Văn thư CNCN Long Bình"
                  defaultValue="Văn phòng Điện tử"
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2 pt-8">
                <div className="flex items-center space-x-2">
                  <Checkbox id="has_attachment" name="has_attachment" />
                  <Label htmlFor="has_attachment" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Có tệp đính kèm
                  </Label>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" asChild className="border-slate-300 text-slate-700">
                <Link href="/news">Hủy bỏ</Link>
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                Đăng bản tin
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
