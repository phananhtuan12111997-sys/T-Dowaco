import { Skeleton } from "@/components/ui/skeleton"

export default function HrLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="border rounded-md bg-white">
        <div className="h-12 border-b bg-slate-50/50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center p-4 border-b gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-24 shrink-0" />
            <Skeleton className="h-6 w-24 shrink-0" />
            <Skeleton className="h-8 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
