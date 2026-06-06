import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Search, Eye, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default async function SentDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Lấy dữ liệu công văn đã gửi bởi user hiện tại
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('created_by', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>T-Dowaco</span>
            <span>→</span>
            <span>Công văn đã gửi</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Hộp thư đi</h1>
        </div>
        
        <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Link href="/documents/create">
            <Plus className="mr-2 h-4 w-4" /> Soạn văn bản mới
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <h2 className="font-semibold text-slate-800">Danh sách văn bản đã phát hành</h2>
          
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Tìm số ký hiệu, trích yếu..."
              className="pr-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-center">Số ký hiệu</th>
                <th className="px-6 py-4 font-medium">Trích yếu</th>
                <th className="px-6 py-4 font-medium text-center">Loại văn bản</th>
                <th className="px-6 py-4 font-medium text-center">Ngày gửi</th>
                <th className="px-6 py-4 font-medium text-center">Người nhận</th>
                <th className="px-6 py-4 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 text-center">{doc.symbol_number}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-md truncate" title={doc.summary}>
                      {doc.summary}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-600 border-cyan-200 font-normal">
                        {doc.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-center">
                      {new Date(doc.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500">
                        <Users className="h-4 w-4" />
                        <span>1</span>
                      </div>
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
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Chưa có công văn nào được gửi
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
