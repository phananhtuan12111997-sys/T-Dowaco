'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { CheckCircle2, X } from 'lucide-react'

function SuccessAlertInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const successParam = searchParams.get('success')
    if (successParam === '1' || successParam === 'updated') {
      setShow(true)
      if (successParam === '1') setMessage('Tạo lịch họp thành công!')
      if (successParam === 'updated') setMessage('Cập nhật lịch họp thành công!')
      
      // Clean up the URL parameter without reloading the page
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('success')
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, pathname, router])

  if (!show) return null

  return (
    <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-start sm:items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button 
        onClick={() => setShow(false)}
        className="text-emerald-600 hover:bg-emerald-100 p-1 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function SuccessAlert() {
  return (
    <Suspense fallback={null}>
      <SuccessAlertInner />
    </Suspense>
  )
}
