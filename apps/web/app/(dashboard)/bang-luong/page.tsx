import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Download, FileSpreadsheet, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { markAsRead } from './actions'

// Hàm format tiền tệ (VND)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Đã xem') {
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã xem</Badge>
  }
  return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Chưa xem</Badge>
}

// Đây là component cho nút đánh dấu đã đọc (Sử dụng Client Component pattern hoặc Form)
function ViewButton({ id }: { id: string }) {
  return (
    <form action={async () => {
      'use server'
      await markAsRead(id)
    }}>
      <Button type="submit" variant="ghost" className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
        Xem chi tiết
      </Button>
    </form>
  )
}

export default async function PayslipsPage({
  searchParams,
}: {
  searchParams: { year?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const currentYear = new Date().getFullYear()
  const resolvedSearchParams = await searchParams
  const selectedYear = resolvedSearchParams?.year ? parseInt(resolvedSearchParams.year) : currentYear
  
  // Truy vấn dữ liệu phiếu lương của user theo năm
  const { data: payslips } = await supabase
    .from('payslips')
    .select('*')
    .eq('user_id', user?.id)
    .eq('year', selectedYear)
    .order('month', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Tra cứu lương</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Phiếu lương cá nhân</h1>
        </div>
        
        {/* Nút này chỉ nên hiện cho Kế Toán, nhưng tạm thời cứ để để test */}
        <Button asChild variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
          <Link href="/bang-luong/create">
            <Plus className="mr-2 h-4 w-4" /> Kế toán: Nhập phiếu lương
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
          <h2 className="font-semibold text-slate-800">Danh sách phiếu lương năm {selectedYear}</h2>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Chọn năm:</span>
            {/* Trong thực tế, việc filter sẽ cần client component router.push, ở đây dùng demo tĩnh */}
            <Select defaultValue={selectedYear.toString()}>
              <SelectTrigger className="w-[120px] bg-white">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(currentYear).toString()}>{currentYear}</SelectItem>
                <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                <SelectItem value={(currentYear - 2).toString()}>{currentYear - 2}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-bold text-white uppercase bg-[#1a56db] border-b border-[#1a56db] [&_th]:font-bold [&_th]:whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-medium">THÁNG</th>
                <th className="px-6 py-4 font-medium">TIÊU ĐỀ</th>
                <th className="px-6 py-4 font-medium text-right">TỔNG LƯƠNG</th>
                <th className="px-6 py-4 font-medium text-center">FILE ĐÍNH KÈM</th>
                <th className="px-6 py-4 font-medium text-center">TRẠNG THÁI</th>
                <th className="px-6 py-4 font-medium text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {payslips && payslips.length > 0 ? (
                payslips.map((slip) => (
                  <tr key={slip.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      Tháng {slip.month}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{slip.title}</div>
                      <div className="text-xs text-slate-400 mt-1">Cập nhật: {new Date(slip.created_at).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(slip.total_salary)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {slip.attachment_url ? (
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <FileSpreadsheet className="h-4 w-4 mr-2" /> Tải Excel
                        </Button>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Không có file</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={slip.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ViewButton id={slip.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Info className="h-8 w-8 mb-2 opacity-20" />
                      <p>Không có dữ liệu phiếu lương cho năm {selectedYear}</p>
                    </div>
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
