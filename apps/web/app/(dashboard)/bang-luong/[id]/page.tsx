import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Download, FileSpreadsheet, Printer } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function PayslipDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const resolvedParams = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Lấy chi tiết phiếu lương
  const { data: payslip } = await supabase
    .from('payslips')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!payslip) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy phiếu lương</h2>
        <p className="text-slate-500 mb-6">Phiếu lương này không tồn tại hoặc bạn không có quyền xem.</p>
        <Button asChild>
          <Link href="/bang-luong">Quay lại danh sách</Link>
        </Button>
      </div>
    )
  }

  // Đảm bảo chỉ người dùng đó hoặc admin/kế toán mới được xem (nếu cần thêm điều kiện)
  if (payslip.user_id !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('is_admin, department').eq('id', user.id).single()
    const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch')
    const isAccountant = profile?.department?.toLowerCase().includes('kế toán')
    if (!profile?.is_admin && !isHR && !isAccountant) {
      redirect('/bang-luong')
    }
  }

  const { data: profileData } = await supabase.from('profiles').select('full_name, department, position').eq('id', payslip.user_id).single()

  const details = payslip.details || {}
  const profile = profileData || {}

  const formatMoney = (val: any) => {
    if (typeof val === 'number') return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    if (typeof val === 'string') {
      const num = parseFloat(val.replace(/[^0-9.-]+/g,""))
      if (!isNaN(num)) return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
      return val
    }
    return val
  }

  let netSalary = payslip.net_salary || 0
  if (netSalary === 0 && details) {
    const totalKey = Object.keys(details).find(k => k.toUpperCase().includes('THỰC LÃNH') || k.toUpperCase().includes('QUA THẺ ATM') || k.toUpperCase().includes('LƯƠNG TRẢ QUA THẺ ATM'))
    if (totalKey && details[totalKey]) {
      const val = details[totalKey]
      if (typeof val === 'number') netSalary = val
      else if (typeof val === 'string') {
        const num = parseFloat(val.replace(/[^0-9.-]+/g,""))
        if (!isNaN(num)) netSalary = num
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Link href="/bang-luong">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#1a56db]">{`Phiếu lương tháng ${payslip.month}/${payslip.year}`}</h1>
            <p className="text-sm text-slate-500">Cập nhật lúc: {new Date(payslip.created_at).toLocaleString('vi-VN')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white" onClick={/* print would be client side, so ignoring for now or making a print wrapper */ undefined}>
            <Printer className="h-4 w-4 mr-2" /> In phiếu
          </Button>
        </div>
      </div>

      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl text-[#1a56db]">THÔNG TIN NHÂN VIÊN</CardTitle>
              <CardDescription className="text-base font-medium mt-1 text-slate-800">
                {profile.full_name}
              </CardDescription>
            </div>
            <div className="text-right text-sm space-y-1">
              <p><span className="text-slate-500 mr-2">Phòng ban:</span> <span className="font-semibold">{profile.department || 'Chưa cập nhật'}</span></p>
              <p><span className="text-slate-500 mr-2">Chức vụ:</span> <span className="font-semibold">{profile.position || 'Chưa cập nhật'}</span></p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-emerald-800 font-semibold text-lg">THỰC LÃNH CHUYỂN KHOẢN</h3>
              <p className="text-emerald-600/80 text-sm">Tổng số tiền được nhận qua thẻ ATM</p>
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {formatMoney(netSalary)}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">CHI TIẾT CÁC KHOẢN THU NHẬP & KHẤU TRỪ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              {Object.keys(details).filter(k => k.toLowerCase() !== 'họ và tên' && k.toLowerCase() !== 'stt' && k.toLowerCase() !== 'mã nv').map((key, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600 text-sm">{key}</span>
                  <span className="font-semibold text-slate-800">{formatMoney(details[key])}</span>
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
