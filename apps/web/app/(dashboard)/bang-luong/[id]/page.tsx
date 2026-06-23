import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react'
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

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Lấy chi tiết phiếu lương
  const { data: payslip } = await supabaseAdmin
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
    const { data: profile } = await supabase.from('profiles').select('is_admin, department, full_name, role').eq('id', user.id).single()
    const fullName = profile?.full_name?.toLowerCase() || ''
    const roleName = profile?.role?.toLowerCase() || ''
    const departmentName = profile?.department?.toLowerCase() || ''

    const isChau = fullName.includes('nguyễn thị hồng châu') || fullName.includes('nguyễn thi hồng châu')
    const isTuyet = fullName.includes('lê thị kim tuyết')
    const isChiefAccountant = roleName.includes('kế toán trưởng') || (departmentName.includes('kế toán') && roleName.includes('trưởng'))
    const isAdmin = profile?.is_admin === true

    if (!isAdmin && !isChau && !isTuyet && !isChiefAccountant) {
      redirect('/bang-luong')
    }
  }
  const { data: profileData } = await supabaseAdmin.from('profiles').select('full_name, department, role').eq('id', payslip.user_id).single()

  // Không update is_read ở đây để tránh lỗi prefetch của Next.js
  // is_read đã được update thông qua Server Action khi user click vào link

  const details = payslip.details || {}
  const profile: any = profileData || {}

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
    const totalKey = Object.keys(details).find(k => {
      const clean = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
      return clean.includes('THUCLANH') || clean.includes('QUATHEATM');
    })
    if (totalKey && details[totalKey]) {
      const val = details[totalKey]
      if (typeof val === 'number') netSalary = val
      else if (typeof val === 'string') {
        const num = parseFloat(val.replace(/[^0-9.-]+/g,""))
        if (!isNaN(num)) netSalary = num
      }
    }
  }

  const elements: { type: 'group' | 'standalone', name: string, items?: { label: string, value: any }[], value?: any }[] = [];
  let currentGroup: string | null = null;
  let currentItems: { label: string, value: any }[] = [];

  const orderArray: string[] = details['_headersOrder'] || [];
  
  const keysToProcess = Object.keys(details).filter(k => {
    if (k === '_headersOrder') return false;
    const clean = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
    return clean !== 'HOVATEN' && 
           clean !== 'HOTEN' &&
           clean !== 'STT' && 
           clean !== 'MANV' &&
           !clean.includes('THUCLANH') &&
           !clean.includes('QUATHEATM')
  });

  if (orderArray.length > 0) {
    keysToProcess.sort((a, b) => {
      let idxA = orderArray.indexOf(a);
      let idxB = orderArray.indexOf(b);
      // Fallback: if a sub-column was reformatted with " - " but the original array had it differently
      if (idxA === -1 && a.includes(' - ')) {
        const parent = a.split(' - ')[0] || '';
        const matchIdx = orderArray.findIndex(h => h.startsWith(parent));
        if (matchIdx !== -1) idxA = matchIdx;
      }
      if (idxB === -1 && b.includes(' - ')) {
        const parent = b.split(' - ')[0] || '';
        const matchIdx = orderArray.findIndex(h => h.startsWith(parent));
        if (matchIdx !== -1) idxB = matchIdx;
      }
      
      idxA = idxA !== -1 ? idxA : 9999;
      idxB = idxB !== -1 ? idxB : 9999;
      return idxA - idxB;
    });
  }

  keysToProcess.forEach(key => {
     if (key.includes(' - ')) {
         const parts = key.split(' - ');
         const parent = parts[0]?.trim() || '';
         const child = parts.slice(1).join(' - ').trim();
         
         if (currentGroup === parent) {
             currentItems.push({ label: child, value: details[key] });
         } else {
             if (currentItems.length > 0) {
                 elements.push({ type: 'group', name: currentGroup!, items: currentItems });
             }
             currentGroup = parent;
             currentItems = [{ label: child, value: details[key] }];
         }
     } else {
         // Flush any pending group
         if (currentItems.length > 0) {
             elements.push({ type: 'group', name: currentGroup!, items: currentItems });
             currentItems = [];
             currentGroup = null;
         }
         elements.push({ type: 'standalone', name: key, value: details[key] });
     }
  });
  if (currentItems.length > 0) {
      elements.push({ type: 'group', name: currentGroup!, items: currentItems });
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
              <p><span className="text-slate-500 mr-2">Chức vụ:</span> <span className="font-semibold">{profile.role || 'Chưa cập nhật'}</span></p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
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
            <h3 className="font-bold text-slate-800 mb-6 border-b pb-2">CHI TIẾT CÁC KHOẢN THU NHẬP & KHẤU TRỪ</h3>
            <div className="flex flex-col gap-4 items-stretch">
              {elements.map((el, idx) => {
                if (el.type === 'group') {
                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col bg-white">
                      <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200">
                        <h4 className="font-semibold text-[#1a56db] uppercase text-sm tracking-wide">{el.name}</h4>
                      </div>
                      <div className="p-0 flex flex-col">
                        {el.items?.map((item, jdx) => {
                          const valStr = formatMoney(item.value);
                          const isZero = item.value === 0 || item.value === '0' || item.value === '-' || valStr === '0 ₫' || valStr === '0 ₫' || valStr === '-';
                          const isHighlight = item.label.toUpperCase().includes('TỔNG');
                          return (
                            <div key={jdx} className={`flex justify-between items-center px-4 py-3 border-b border-slate-100 last:border-0 ${jdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                              <span className={`text-sm ${isZero ? 'text-slate-400' : 'text-slate-600'} w-3/5 pr-4 ${isHighlight ? 'font-semibold text-slate-800' : ''}`}>{item.label}</span>
                              <span className={`text-right ${isZero ? 'text-slate-400 font-normal' : 'font-semibold text-slate-800'} ${isHighlight ? 'text-[#1a56db]' : ''}`}>{valStr}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                } else {
                  // Standalone item
                  const valStr = formatMoney(el.value);
                  const isZero = el.value === 0 || el.value === '0' || el.value === '-' || valStr === '0 ₫' || valStr === '0 ₫' || valStr === '-';
                  const isHighlight = el.name.toUpperCase().includes('TỔNG');
                  
                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg shadow-sm overflow-hidden bg-white">
                      <div className={`flex justify-between items-center px-4 py-3`}>
                        <span className={`text-sm font-semibold text-[#1a56db] uppercase tracking-wide w-3/5 pr-4`}>{el.name}</span>
                        <span className={`text-right ${isZero ? 'text-slate-400 font-normal' : 'font-semibold text-slate-800'} ${isHighlight ? 'text-[#1a56db]' : ''}`}>{valStr}</span>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
