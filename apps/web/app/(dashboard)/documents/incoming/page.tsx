import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'

export default async function IncomingDocumentsPage() {
  const supabase = await createClient()
  
  // Lấy dữ liệu công văn đến (demo)
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>T-Dowaco</span>
            <span>→</span>
            <span>Công văn đến</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Danh sách Công văn đến</h1>
        </div>
        
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/documents/create">
            <Plus className="mr-2 h-4 w-4" /> Soạn công văn mới
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <h2 className="font-semibold text-[#1a56db]">Hộp thư đến</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Loại công văn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Tất cả loại --</SelectItem>
                <SelectItem value="tb">Thông báo</SelectItem>
                <SelectItem value="qd">Quyết định</SelectItem>
                <SelectItem value="bc">Báo cáo</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Độ ưu tiên --</SelectItem>
                <SelectItem value="high">Quan trọng</SelectItem>
                <SelectItem value="normal">Bình thường</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Tìm số ký hiệu, trích yếu..."
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Ưu tiên</th>
                <th className="px-6 py-4 font-medium">Số ký hiệu</th>
                <th className="px-6 py-4 font-medium">Trích yếu</th>
                <th className="px-6 py-4 font-medium">Người gửi</th>
                <th className="px-6 py-4 font-medium">Ngày gửi</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      {doc.priority ? (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <Star className="h-4 w-4 text-slate-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{doc.symbol_number}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-md truncate" title={doc.summary}>
                      {doc.summary}
                    </td>
                    <td className="px-6 py-4">{doc.sender_name}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-normal">
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600">
                        <Search className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Chưa có công văn nào
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
