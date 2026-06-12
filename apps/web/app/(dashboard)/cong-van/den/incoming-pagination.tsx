'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface IncomingPaginationProps {
  totalCount: number
  limit: number
}

export function IncomingPagination({ totalCount, limit }: IncomingPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPageStr = searchParams.get('page') || '1'
  const currentPage = parseInt(currentPageStr, 10) || 1
  const totalPages = Math.ceil(totalCount / limit)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  if (totalCount === 0) return null

  const renderPages = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "ghost"}
            size="sm"
            className={currentPage === i ? "bg-blue-600 text-white" : "text-slate-600"}
            onClick={() => router.push(pathname + '?' + createQueryString('page', i.toString()))}
          >
            {i}
          </Button>
        )
      } else if (
        i === currentPage - 2 || 
        i === currentPage + 2
      ) {
        pages.push(<span key={i} className="text-slate-500 px-2">...</span>)
      }
    }
    return pages
  }

  const startResult = (currentPage - 1) * limit + 1
  const endResult = Math.min(currentPage * limit, totalCount)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200">
      <div className="text-sm text-slate-500">
        Hiển thị {startResult} đến {endResult} trên tổng số {totalCount} kết quả
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600"
          disabled={currentPage <= 1}
          onClick={() => router.push(pathname + '?' + createQueryString('page', (currentPage - 1).toString()))}
        >
          Trước
        </Button>
        {renderPages()}
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600"
          disabled={currentPage >= totalPages}
          onClick={() => router.push(pathname + '?' + createQueryString('page', (currentPage + 1).toString()))}
        >
          Sau
        </Button>
      </div>
    </div>
  )
}
