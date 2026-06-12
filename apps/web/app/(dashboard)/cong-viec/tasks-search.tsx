'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function TasksSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isPending, startTransition] = useTransition()
  const currentQ = searchParams.get('q') || ''
  const [search, setSearch] = useState(currentQ)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('q', search))
    })
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full md:w-auto items-center space-x-2">
      <div className="relative w-full md:w-[300px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          type="search"
          placeholder="Tìm kiếm công việc..."
          className="pl-9 w-full bg-white border-slate-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isPending} variant="secondary">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tìm'}
      </Button>
    </form>
  )
}
