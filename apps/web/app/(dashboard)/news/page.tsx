import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Search, Eye, Paperclip, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function NewsPage() {
  const supabase = await createClient()
  
  const { data: news } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>T-Dowaco</span>
            <span>→</span>
            <span>Bảng tin nội bộ</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Bản tin công ty</h1>
        </div>
        
        <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Link href="/news/create">
            <Plus className="mr-2 h-4 w-4" /> Đăng tin mới
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <h2 className="font-semibold text-slate-800">Thông tin nội bộ và thông báo</h2>
          
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Tìm tiêu đề, nội dung..."
              className="pr-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Nội dung tin tức</th>
                <th className="px-6 py-4 font-medium text-center">Người đăng</th>
                <th className="px-6 py-4 font-medium text-center">Ngày đăng</th>
                <th className="px-6 py-4 font-medium text-center">Tiện ích</th>
                <th className="px-6 py-4 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {news && news.length > 0 ? (
                news.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 max-w-xl">
                      <div className="font-bold text-slate-900 mb-1 uppercase text-sm">{item.title}</div>
                      <div className="text-slate-500 text-xs truncate" title={item.content}>
                        {item.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs">
                        <User className="h-3.5 w-3.5" />
                        <span>{item.author_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 text-xs">
                      {new Date(item.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                      <br/>
                      {new Date(item.created_at).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.has_attachment && (
                        <div className="flex justify-center">
                          <Paperclip className="h-4 w-4 text-blue-500" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-full">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Chưa có bản tin nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
