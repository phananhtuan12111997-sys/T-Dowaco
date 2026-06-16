'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Upload, ChevronDown, ChevronUp, FileSpreadsheet, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { revokeMonthPayslips, markAsRead } from './actions'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Đã xem') {
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã xem</Badge>
  }
  return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Chưa xem</Badge>
}

// Group payslips by month
function groupPayslipsByMonth(payslips: any[]) {
  const groups: Record<number, any[]> = {}
  payslips.forEach(p => {
    let group = groups[p.month]
    if (!group) {
      group = []
      groups[p.month] = group
    }
    group.push(p)
  })
  return groups
}

export default function PayslipListClient({ 
  payslips, 
  canUpload, 
  selectedYear 
}: { 
  payslips: any[], 
  canUpload: boolean,
  selectedYear: number
}) {
  const router = useRouter()
  const [expandedMonths, setExpandedMonths] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const toggleMonth = (month: number) => {
    setExpandedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    )
  }

  const handleRevoke = async (month: number) => {
    if (!confirm(`Bạn có chắc chắn muốn thu hồi toàn bộ phiếu lương của tháng ${month}/${selectedYear} không?`)) {
      return
    }
    
    setIsProcessing(true)
    try {
      const result = await revokeMonthPayslips(month, selectedYear)
      if (result.success) {
        alert('Thu hồi thành công!')
        router.refresh()
      } else {
        alert(result.error || 'Có lỗi xảy ra khi thu hồi.')
      }
    } catch (e) {
      console.error(e)
      alert('Đã xảy ra lỗi.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!canUpload) {
    // Normal user view: flat list
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs font-bold text-white uppercase bg-[#1a56db] border-b border-[#1a56db] [&_th]:font-bold [&_th]:whitespace-nowrap">
            <tr>
              <th className="px-6 py-4 font-medium">THÁNG</th>
              <th className="px-6 py-4 font-medium">TIÊU ĐỀ</th>
              <th className="px-6 py-4 font-medium text-right">TỔNG LƯƠNG (THỰC NHẬN)</th>
              <th className="px-6 py-4 font-medium text-center">FILE ĐÍNH KÈM</th>
              <th className="px-6 py-4 font-medium text-center">TRẠNG THÁI</th>
              <th className="px-6 py-4 font-medium text-center">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {payslips && payslips.length > 0 ? (
              payslips.map((slip: any) => {
                let netSalary = slip.net_salary || 0
                if (netSalary === 0 && slip.details) {
                  const totalKey = Object.keys(slip.details).find(k => {
                    const clean = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
                    return clean.includes('THUCLANH') || clean.includes('QUATHEATM');
                  })
                  if (totalKey && slip.details[totalKey]) {
                    const val = slip.details[totalKey]
                    if (typeof val === 'number') netSalary = val
                    else if (typeof val === 'string') {
                      const num = parseFloat(val.replace(/[^0-9.-]+/g,""))
                      if (!isNaN(num)) netSalary = num
                    }
                  }
                }
                
                return (
                  <tr key={slip.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      Tháng {slip.month}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">
                        {`Phiếu lương tháng ${slip.month}/${slip.year}`}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Cập nhật: {new Date(slip.created_at).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(netSalary)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-400 italic text-xs">Không có file</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status="Chưa xem" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <form action={async () => {
                        await markAsRead(slip.id)
                      }}>
                        <Button type="submit" variant="ghost" className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                          Xem chi tiết
                        </Button>
                      </form>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2" />
                    <p>Không có dữ liệu phiếu lương cho năm {selectedYear}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  // Admin view: grouped by month
  const groupedPayslips = groupPayslipsByMonth(payslips)
  const months = Object.keys(groupedPayslips).map(Number).sort((a, b) => b - a)

  if (months.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="flex flex-col items-center justify-center">
          <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2" />
          <p>Không có dữ liệu phiếu lương nào trong năm {selectedYear}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {months.map(month => {
        const monthPayslips = groupedPayslips[month]
        const isExpanded = expandedMonths.includes(month)

        return (
          <div key={month} className="border-b border-slate-200 last:border-0">
            <div 
              className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-blue-50/50' : ''}`}
              onClick={() => toggleMonth(month)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">Tháng {month}/{selectedYear}</h3>
                  <p className="text-sm text-slate-500">{monthPayslips?.length || 0} nhân viên</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleRevoke(month)}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Thu hồi
                </Button>
                <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                  className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Link href={`/bang-luong/create?month=${month}&year=${selectedYear}`}>
                    <Upload className="h-4 w-4 mr-1" /> Ghi đè
                  </Link>
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="bg-white border-t border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 font-medium">NHÂN VIÊN</th>
                        <th className="px-6 py-3 font-medium text-right">THỰC NHẬN</th>
                        <th className="px-6 py-3 font-medium text-center">TRẠNG THÁI</th>
                        <th className="px-6 py-3 font-medium text-center">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthPayslips?.map((slip: any) => {
                        let netSalary = slip.net_salary || 0
                        if (netSalary === 0 && slip.details) {
                          const totalKey = Object.keys(slip.details).find(k => {
                            const clean = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
                            return clean.includes('THUCLANH') || clean.includes('QUATHEATM');
                          })
                          if (totalKey && slip.details[totalKey]) {
                            const val = slip.details[totalKey]
                            if (typeof val === 'number') netSalary = val
                            else if (typeof val === 'string') {
                              const num = parseFloat(val.replace(/[^0-9.-]+/g,""))
                              if (!isNaN(num)) netSalary = num
                            }
                          }
                        }
                        
                        return (
                          <tr key={slip.id} className="border-b border-slate-100 hover:bg-slate-50/50 last:border-0">
                            <td className="px-6 py-3">
                              <div className="font-medium text-slate-900">{slip.profiles?.full_name || 'Không xác định'}</div>
                              <div className="text-xs text-slate-400">Cập nhật: {new Date(slip.created_at).toLocaleDateString('vi-VN')}</div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <span className="font-bold text-emerald-600">
                                {formatCurrency(netSalary)}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-center">
                              <StatusBadge status="Chưa xem" />
                            </td>
                            <td className="px-6 py-3 text-center">
                              <Button asChild variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                <Link href={`/bang-luong/${slip.id}`}>Xem chi tiết</Link>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
