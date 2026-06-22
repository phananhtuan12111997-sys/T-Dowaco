'use client'

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function YearFilter({ currentYear, selectedYear }: { currentYear: number, selectedYear: number }) {
  const router = useRouter()

  const handleYearChange = (year: string) => {
    router.push(`?year=${year}`)
  }

  return (
    <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
      <SelectTrigger className="w-[120px] bg-white">
        <SelectValue placeholder="Chọn năm" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 10 }, (_, i) => currentYear + 1 - i).map(year => (
          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
