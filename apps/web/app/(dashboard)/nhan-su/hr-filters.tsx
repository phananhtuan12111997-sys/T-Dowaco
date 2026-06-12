"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function HrFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentQ = searchParams.get("q") || ""
  const currentDepartment = searchParams.get("department") || "all"
  
  const [searchTerm, setSearchTerm] = useState(currentQ)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      params.set("page", "1") // reset to page 1 on filter change
      return params.toString()
    },
    [searchParams]
  )

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    
    searchTimeoutRef.current = setTimeout(() => {
      router.push(`?${createQueryString("q", val)}`)
    }, 500)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
      <div className="relative w-full sm:w-[300px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Tìm theo tên hoặc tài khoản..."
          className="pl-9 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-full"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      
      <Select 
        value={currentDepartment} 
        onValueChange={(val) => router.push(`?${createQueryString("department", val)}`)}
      >
        <SelectTrigger className="w-full sm:w-[220px] bg-white border-slate-200 rounded-full focus:ring-blue-500">
          <SelectValue placeholder="Tất cả phòng ban" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả phòng ban</SelectItem>
          <SelectItem value="Ban điều hành">Ban điều hành</SelectItem>
          <SelectItem value="Phòng tổ chức Hành chánh">Phòng tổ chức Hành chánh</SelectItem>
          <SelectItem value="Phòng Tài chính Kế toán">Phòng Tài chính Kế toán</SelectItem>
          <SelectItem value="Phòng IT">Phòng IT</SelectItem>
          <SelectItem value="Phòng Kế hoạch Kỹ thuật">Phòng Kế hoạch Kỹ thuật</SelectItem>
          <SelectItem value="Phòng Kinh Doanh">Phòng Kinh Doanh</SelectItem>
          <SelectItem value="Đội xây lắp - Chống thất thoát">Đội xây lắp - Chống thất thoát</SelectItem>
          <SelectItem value="Phân xưởng sản xuất">Phân xưởng sản xuất</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
