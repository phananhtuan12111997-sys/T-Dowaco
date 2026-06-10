'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function RealtimeListSubscriber() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel1 = supabase
      .channel('realtime_documents_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    const channel2 = supabase
      .channel('realtime_recipients_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_recipients' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    const channel3 = supabase
      .channel('realtime_comments_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_comments' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    const channel4 = supabase
      .channel('realtime_reports_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_reports' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel1)
      supabase.removeChannel(channel2)
      supabase.removeChannel(channel3)
      supabase.removeChannel(channel4)
    }
  }, [router])

  return null
}
