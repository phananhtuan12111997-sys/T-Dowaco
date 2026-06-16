'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { uploadBulkPayslips } from '../actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from '@/components/ui/label'

type RowData = Record<string, any>

export default function BulkUploadPayslips() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<RowData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString())
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      processFile(droppedFile)
    } else {
      setError('Vui lòng chọn file Excel hợp lệ (.xlsx hoặc .xls)')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (file: File) => {
    setFile(file)
    setError(null)
    setSuccess(false)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        // Find sheet containing "bang luong" or "bảng lương"
        const normalizeString = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
        
        let targetSheetName = workbook.SheetNames[0] // fallback
        for (const name of workbook.SheetNames) {
          if (normalizeString(name).includes('bang luong')) {
            targetSheetName = name
            break
          }
        }
        
        const sheet = workbook.Sheets[targetSheetName]
        
        // Convert to JSON, starting from the row containing headers.
        const rawJson: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        
        // Find header row (the one containing "HỌ VÀ TÊN" or "Họ và tên")
        let headerRowIdx = -1
        for (let i = 0; i < rawJson.length; i++) {
          const row = rawJson[i]
          if (row.some(cell => typeof cell === 'string' && cell.toUpperCase().includes('HỌ VÀ TÊN'))) {
            headerRowIdx = i
            break
          }
        }
        
        if (headerRowIdx === -1) {
          setError('Không tìm thấy cột "HỌ VÀ TÊN" trong file Excel. Vui lòng kiểm tra lại biểu mẫu.')
          return
        }
        
        const headers = rawJson[headerRowIdx] as string[]
        const rows = rawJson.slice(headerRowIdx + 1)
        
        const structuredData = rows.map(row => {
          const obj: RowData = {}
          headers.forEach((header, index) => {
            if (header && typeof header === 'string') {
              obj[header.trim()] = row[index]
            }
          })
          return obj
        }).filter(row => {
          const nameKey = Object.keys(row).find(k => k.toUpperCase().includes('HỌ VÀ TÊN') || k.toUpperCase().includes('HỌ TÊN'))
          return nameKey && row[nameKey] && String(row[nameKey]).trim().length > 0
        })
        
        setParsedData(structuredData)
      } catch (err) {
        setError('Có lỗi xảy ra khi đọc file Excel. Vui lòng đảm bảo file không bị hỏng.')
        console.error(err)
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      setError('File không có dữ liệu hợp lệ.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const nameKey = Object.keys(parsedData[0]).find(k => k.toUpperCase().includes('HỌ VÀ TÊN') || k.toUpperCase().includes('HỌ TÊN')) || 'HỌ VÀ TÊN'
      const totalKey = Object.keys(parsedData[0]).find(k => k.toUpperCase().includes('THỰC LÃNH') || k.toUpperCase().includes('QUA THẺ ATM') || k.toUpperCase().includes('LƯƠNG TRẢ QUA THẺ ATM')) || 'Lương trả qua thẻ ATM (VNĐ)'
      
      const result = await uploadBulkPayslips({
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        data: parsedData,
        nameField: nameKey,
        totalField: totalKey
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/bang-luong')
          router.refresh()
        }, 2000)
      } else {
        setError(result.error || 'Có lỗi xảy ra trong quá trình cập nhật cơ sở dữ liệu.')
      }
    } catch (err) {
      console.error(err)
      setError('Lỗi hệ thống khi tải lên dữ liệu.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <span>LKWA</span>
          <span>→</span>
          <span>Tra cứu lương</span>
          <span>→</span>
          <span>Tải lên</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1a56db]">Tải lên bảng lương</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nhập liệu tự động bằng Excel</CardTitle>
          <CardDescription>
            Hệ thống sẽ tự động trích xuất thông tin từng khoản lương dựa trên cột "Họ và tên" của nhân viên và tạo phiếu lương cho từng người.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tháng</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Năm</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                  <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              isDragging ? 'border-[#1a56db] bg-blue-50' : 'border-slate-300 hover:border-[#1a56db]'
            } ${file ? 'bg-slate-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="h-12 w-12 text-[#1a56db] mb-4" />
                <p className="font-medium text-slate-800">{file.name}</p>
                <p className="text-sm text-slate-500 mt-1">Đã tìm thấy {parsedData.length} dòng dữ liệu nhân viên</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setFile(null)
                    setParsedData([])
                  }}
                  disabled={isUploading}
                >
                  Chọn file khác
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="font-medium text-slate-800 text-lg mb-1">Kéo thả file Excel vào đây</h3>
                <p className="text-sm text-slate-500 mb-6">hoặc click để chọn file từ máy tính</p>
                <input
                  type="file"
                  id="excel-upload"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <Button asChild variant="secondary" className="bg-slate-200 hover:bg-slate-300 text-slate-800">
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    Duyệt tìm file
                  </label>
                </Button>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription>Đã tạo phiếu lương và gửi thông báo cho {parsedData.length} nhân viên. Đang chuyển hướng...</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50 border-t flex justify-end p-4">
          <Button 
            variant="outline" 
            className="mr-3" 
            onClick={() => router.back()}
            disabled={isUploading}
          >
            Hủy bỏ
          </Button>
          <Button 
            className="bg-[#1a56db] hover:bg-blue-700" 
            disabled={!file || parsedData.length === 0 || isUploading}
            onClick={handleUpload}
          >
            {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Xác nhận tạo Phiếu lương
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
