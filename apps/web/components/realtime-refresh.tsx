'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function RealtimeRefresh({ tables }: { tables: string[] }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let channels: any[] = []
    
    tables.forEach(table => {
      const channel = supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: table }, () => {
          router.refresh()
        })
        .subscribe()
      channels.push(channel)
    })

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [router, tables])

  return null
}
