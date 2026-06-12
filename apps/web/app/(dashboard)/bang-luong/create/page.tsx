import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPayslip } from '../actions'
import Link from 'next/link'
import { FileSpreadsheet, Upload } from 'lucide-react'

export default function CreatePayslipPage() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
        <span>LKWA</span>
        <span>→</span>
        <Link href="/bang-luong" className="hover:text-[#1a56db]">Tra cứu lương</Link>
        <span>→</span>
        <span>Nhập phiếu lương (Dành cho Kế toán)</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#1a56db]">Tạo Phiếu Lương Mới</h2>
            <p className="text-sm text-slate-500 mt-1">Tính năng nhập liệu dành riêng cho phòng Kế toán</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
        </div>
        
        <div className="p-6">
          <form action={createPayslip} className="space-y-6">
            
            {/* TRONG THỰC TẾ: Sẽ có input chọn Nhân Viên. Ở đây tạm ẩn để tự gửi cho chính mình test */}
            
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-700 font-semibold">Tiêu đề phiếu lương <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                name="title" 
                defaultValue={`Phiếu lương tháng ${currentMonth}/${currentYear}`}
                required 
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="month" className="text-slate-700 font-semibold">Tháng <span className="text-red-500">*</span></Label>
                <Select name="month" defaultValue={currentMonth.toString()}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Chọn tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>Tháng {i+1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year" className="text-slate-700 font-semibold">Năm <span className="text-red-500">*</span></Label>
                <Input 
                  id="year" 
                  name="year" 
                  type="number"
                  defaultValue={currentYear}
                  required
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_salary" className="text-slate-700 font-semibold">Tổng lương (VNĐ) <span className="text-red-500">*</span></Label>
              <Input 
                id="total_salary" 
                name="total_salary" 
                type="number"
                placeholder="VD: 15000000"
                required
                className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 font-mono text-lg"
              />
              <p className="text-xs text-slate-500 italic">Đã gộp chung lương kỳ 1, kỳ 2 và các khoản khác.</p>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <Label className="text-slate-700 font-semibold mb-3 block">File Excel chi tiết đính kèm</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Kéo thả file Excel vào đây hoặc click để chọn file</p>
                <p className="text-xs text-slate-400 mt-1">.xlsx, .xls (Tối đa 5MB)</p>
                {/* Mock file upload for demo */}
                <input type="checkbox" id="has_file" name="has_file" className="mt-4" /> 
                <label htmlFor="has_file" className="text-sm ml-2 text-slate-600">Đính kèm file mẫu (Demo)</label>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" asChild className="border-slate-300 text-slate-700">
                <Link href="/bang-luong">Hủy bỏ</Link>
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-8">
                Tạo và Gửi Phiếu lương
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
