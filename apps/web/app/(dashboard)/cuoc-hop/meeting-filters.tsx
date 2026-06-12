'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function MeetingFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isPending, startTransition] = useTransition()

  const currentStatus = searchParams.get('status') || 'all'
  const currentFrom = searchParams.get('from') || ''
  const currentTo = searchParams.get('to') || ''
  const currentQ = searchParams.get('q') || ''

  const [search, setSearch] = useState(currentQ)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      // reset to page 1 when changing filters
      params.set('page', '1')
      return params.toString()
    },
    [searchParams]
  )

  const handleFilterChange = (name: string, value: string) => {
    startTransition(() => {
      router.push(pathname + '?' + createQueryString(name, value))
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('q', search))
    })
  }

  // Only render filters if we are in table view. Calendar view has its own date controls.
  const isTableView = searchParams.get('view') === 'table'

  if (!isTableView) return null

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-6">
      <Select 
        value={currentStatus} 
        onValueChange={(value) => handleFilterChange('status', value)}
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">-- Tất cả trạng thái --</SelectItem>
          <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
          <SelectItem value="ongoing">Đang diễn ra</SelectItem>
          <SelectItem value="ended">Đã kết thúc</SelectItem>
          <SelectItem value="cancelled">Đã hủy</SelectItem>
        </SelectContent>
      </Select>

      <form onSubmit={handleSearch} className="flex w-full sm:w-auto items-center space-x-2 flex-1 min-w-[250px]">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Tìm tiêu đề, chủ trì, địa điểm..."
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending} variant="secondary">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tìm'}
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 whitespace-nowrap">Từ:</span>
        <Input 
          type="date" 
          className="w-full sm:w-[140px]" 
          value={currentFrom}
          onChange={(e) => handleFilterChange('from', e.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 whitespace-nowrap">Đến:</span>
        <Input 
          type="date" 
          className="w-full sm:w-[140px]" 
          value={currentTo}
          onChange={(e) => handleFilterChange('to', e.target.value)}
          disabled={isPending}
        />
      </div>
    </div>
  )
}
