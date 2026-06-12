'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Search, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function IncomingFilters({ users = [] }: { users?: any[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isPending, startTransition] = useTransition()

  const currentType = searchParams.get('type') || 'all'
  const currentUrgency = searchParams.get('urgency') || 'all'
  const currentSender = searchParams.get('sender') || 'all'
  const currentFrom = searchParams.get('from') || ''
  const currentTo = searchParams.get('to') || ''
  const currentQ = searchParams.get('q') || ''

  const [search, setSearch] = useState(currentQ)
  const [openSender, setOpenSender] = useState(false)
  const [senderSearch, setSenderSearch] = useState('')

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
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

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <Select 
        value={currentType} 
        onValueChange={(value) => handleFilterChange('type', value)}
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Loại công văn" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">-- Tất cả loại --</SelectItem>
          <SelectItem value="Báo cáo">Báo cáo</SelectItem>
          <SelectItem value="Biên bản">Biên bản</SelectItem>
          <SelectItem value="Công đoàn">Công đoàn</SelectItem>
          <SelectItem value="Công văn">Công văn</SelectItem>
          <SelectItem value="CV đến đơn thư">CV đến đơn thư</SelectItem>
          <SelectItem value="CV đến thư mời">CV đến thư mời</SelectItem>
          <SelectItem value="CV khác">CV khác</SelectItem>
          <SelectItem value="CV từ Ban ngành">CV từ Ban ngành</SelectItem>
          <SelectItem value="CV từ Cty khác">CV từ Cty khác</SelectItem>
          <SelectItem value="CV từ Sở">CV từ Sở</SelectItem>
          <SelectItem value="CV từ UBND">CV từ UBND</SelectItem>
          <SelectItem value="Đảng">Đảng</SelectItem>
          <SelectItem value="Phiếu phối hợp">Phiếu phối hợp</SelectItem>
          <SelectItem value="Quyết định">Quyết định</SelectItem>
          <SelectItem value="Thông báo">Thông báo</SelectItem>
          <SelectItem value="Thư mời">Thư mời</SelectItem>
          <SelectItem value="Tờ trình">Tờ trình</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={currentUrgency}
        onValueChange={(value) => handleFilterChange('urgency', value)}
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Độ ưu tiên" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">-- Độ ưu tiên --</SelectItem>
          <SelectItem value="high">Quan trọng</SelectItem>
          <SelectItem value="normal">Bình thường</SelectItem>
        </SelectContent>
      </Select>

      <form onSubmit={handleSearch} className="flex w-full sm:w-auto items-center space-x-2 flex-1">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Tìm số ký hiệu, trích yếu..."
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending} variant="secondary">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tìm'}
        </Button>
      </form>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        <Popover open={openSender} onOpenChange={setOpenSender}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSender}
              className="w-full sm:w-[250px] justify-between font-normal text-slate-600"
              disabled={isPending}
            >
              <span className="truncate">
                {currentSender === 'all' 
                  ? "Tất cả người gửi" 
                  : users.find((user) => user.id === currentSender)?.full_name || "Không tìm thấy"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Tìm kiếm người gửi..." 
                value={senderSearch}
                onValueChange={setSenderSearch}
              />
              <CommandList>
                <CommandEmpty>Không tìm thấy người gửi.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      handleFilterChange('sender', 'all')
                      setOpenSender(false)
                      setSenderSearch('')
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentSender === 'all' ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Tất cả người gửi
                  </CommandItem>
                  {senderSearch.trim().length > 0 && users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.full_name}
                      onSelect={() => {
                        handleFilterChange('sender', user.id)
                        setOpenSender(false)
                        setSenderSearch('')
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentSender === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {user.full_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 whitespace-nowrap">Từ ngày:</span>
          <Input 
            type="date" 
            className="w-full sm:w-[150px]" 
            value={currentFrom}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 whitespace-nowrap">Đến ngày:</span>
          <Input 
            type="date" 
            className="w-full sm:w-[150px]" 
            value={currentTo}
            onChange={(e) => handleFilterChange('to', e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  )
}
