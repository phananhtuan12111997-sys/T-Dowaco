"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HrPaginationProps {
  totalItems: number
  currentPage: number
  pageSize: number
}

export function HrPagination({ totalItems, currentPage, pageSize }: HrPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const totalPages = Math.ceil(totalItems / pageSize)
  if (totalPages <= 1) return null

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", pageNumber.toString())
    return `?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
      <div className="text-sm text-slate-500">
        Hiển thị <span className="font-medium text-slate-900">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span> đến <span className="font-medium text-slate-900">{Math.min(currentPage * pageSize, totalItems)}</span> trong <span className="font-medium text-slate-900">{totalItems}</span> nhân viên
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(createPageUrl(currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Trang trước</span>
        </Button>
        <div className="text-sm font-medium text-slate-700 px-2">
          {currentPage} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(createPageUrl(currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Trang sau</span>
        </Button>
      </div>
    </div>
  )
}
