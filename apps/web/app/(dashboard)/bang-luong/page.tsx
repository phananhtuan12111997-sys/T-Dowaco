import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
import { YearFilter } from './YearFilter'
import { markAsRead } from './actions'
import PayslipListClient from './PayslipListClient'

export const dynamic = 'force-dynamic'

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
  
  // Lấy thông tin user hiện tại để kiểm tra quyền
  const { data: profile } = await supabase
    .from('profiles')
    .select('department, is_admin, full_name, role')
    .eq('id', user?.id)
    .single()

  const fullName = profile?.full_name?.toLowerCase() || ''
  const roleName = profile?.role?.toLowerCase() || ''
  const departmentName = profile?.department?.toLowerCase() || ''

  const isChau = fullName.includes('nguyễn thị hồng châu') || fullName.includes('nguyễn thi hồng châu')
  const isTuyet = fullName.includes('lê thị kim tuyết')
  const isChiefAccountant = roleName.includes('kế toán trưởng') || (departmentName.includes('kế toán') && roleName.includes('trưởng'))
  const isAdmin = profile?.is_admin === true
  
  const canUpload = isAdmin || isChau || isTuyet || isChiefAccountant

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Truy vấn dữ liệu phiếu lương của user theo năm (không dùng join qua foreign key vì DB đang thiếu constraint)
  let query = supabaseAdmin
    .from('payslips')
    .select('*')
    .eq('year', selectedYear)
    .order('month', { ascending: false })
    
  if (!canUpload) {
    query = query.eq('user_id', user?.id)
  }

  const { data: payslipsData } = await query
  
  // Gán thông tin profile thủ công
  let payslips = payslipsData || []
  if (payslips.length > 0) {
    const userIds = [...new Set(payslips.map(p => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
      
    if (profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p]))
      
      const { data: notifications } = await supabaseAdmin
        .from('notifications')
        .select('document_id, is_read')
        .in('document_id', payslips.map(p => p.id))
        
      const notifMap = new Map((notifications || []).map(n => [n.document_id, n.is_read]))

      payslips = payslips.map(slip => ({
        ...slip,
        profiles: profileMap.get(slip.user_id),
        status: notifMap.get(slip.id) ? 'Đã xem' : 'Chưa xem'
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Tra cứu lương</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">
            {canUpload ? 'Quản lý phiếu lương toàn công ty' : 'Phiếu lương cá nhân'}
          </h1>
        </div>
        
        {canUpload && (
          <Button asChild variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50">
            <Link href="/bang-luong/create">
              <Plus className="mr-2 h-4 w-4" /> Tải lên bảng lương (Excel)
            </Link>
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
          <h2 className="font-semibold text-slate-800">Danh sách phiếu lương năm {selectedYear}</h2>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Chọn năm:</span>
            <YearFilter currentYear={currentYear} selectedYear={selectedYear} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <PayslipListClient payslips={payslips} canUpload={canUpload} selectedYear={selectedYear} />
        </div>
      </div>
    </div>
  )
}
