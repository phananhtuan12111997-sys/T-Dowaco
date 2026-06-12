"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const statusTabs = [
  { id: "all", label: "Tất cả" },
  { id: "Chờ duyệt", label: "Chờ duyệt" },
  { id: "Đã duyệt", label: "Đã duyệt" },
  { id: "Từ chối", label: "Từ chối" },
  { id: "Đã hoàn thành", label: "Đã hoàn thành" }
]

export function VehicleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  
  const currentStatus = searchParams.get("status") || "all"

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      // reset page when filtering
      params.set("page", "1")
      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm) {
        params.set("q", searchTerm)
      } else {
        params.delete("q")
      }
      
      // reset page on search
      if (searchParams.get("q") !== searchTerm) {
        params.set("page", "1")
      }

      const newQueryString = params.toString()
      const currentQueryString = searchParams.toString()
      
      if (newQueryString !== currentQueryString) {
        router.push(`?${newQueryString}`)
      }
    }, 500)

    return () => clearTimeout(handler)
  }, [searchTerm, router, searchParams])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        {/* Quick Tabs */}
        <div className="flex overflow-x-auto pb-2 xl:pb-0 hide-scrollbar gap-2 w-full xl:w-auto">
          {statusTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={currentStatus === tab.id ? "default" : "outline"}
              className={`rounded-full whitespace-nowrap ${currentStatus === tab.id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white text-slate-600 border-slate-200'}`}
              onClick={() => {
                if (tab.id === 'all') {
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete("status")
                  params.set("page", "1")
                  router.push(`?${params.toString()}`)
                } else {
                  router.push(`?${createQueryString("status", tab.id)}`)
                }
              }}
              size="sm"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full xl:w-[350px] flex-shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm người đặt, địa điểm..."
            className="pl-9 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
