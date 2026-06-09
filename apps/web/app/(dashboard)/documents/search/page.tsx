import { createClient } from '@/utils/supabase/server'
import { Search, Check, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function SearchDocumentsPage() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Lấy dữ liệu công văn cũ (trong thực tế có thể lọc theo thời gian hoặc status)
  const { data: documents } = await supabaseAdmin
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>T-Dowaco</span>
            <span>→</span>
            <span>Hệ thống văn bản cũ</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Tra cứu dữ liệu lịch sử</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <h2 className="font-semibold text-slate-800">Danh sách công văn cũ</h2>
          
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Tìm tên, số công văn, nơi gửi"
              className="pr-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium text-center">Số công văn</th>
                <th className="px-6 py-4 font-medium">Tên công văn / Trích yếu</th>
                <th className="px-6 py-4 font-medium">Nơi gửi</th>
                <th className="px-6 py-4 font-medium text-center">Ngày gửi</th>
                <th className="px-6 py-4 font-medium text-center">Xem</th>
                <th className="px-6 py-4 font-medium text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {documents && documents.length > 0 ? (
                documents.map((doc, index) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500">#{doc.id.substring(0, 5).toUpperCase()}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 text-center">{doc.symbol_number || '0'}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-md truncate" title={doc.summary}>
                      {doc.summary}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{doc.sender_name}</td>
                    <td className="px-6 py-4 text-slate-500 text-center">
                      {new Date(doc.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <Check className="h-4 w-4 text-emerald-500" />
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
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div>Hiển thị {documents?.length || 0} kết quả trên tổng số {documents?.length || 0}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled>Trước</Button>
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 w-8 h-8 p-0">1</Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">2</Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">3</Button>
            <Button variant="ghost" size="sm">Sau</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
