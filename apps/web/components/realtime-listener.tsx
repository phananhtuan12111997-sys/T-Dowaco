'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function RealtimeListener({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('dashboard-realtime')

    // Listen for new tasks assigned to this user
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_recipients',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        router.refresh()
      }
    )

    // Listen for new documents assigned to this user
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'document_recipients',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        router.refresh()
      }
    )

    // Listen for new meetings
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meetings'
      },
      (payload) => {
        router.refresh()
      }
    )

    // Listen for notifications
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        router.refresh()
      }
    )

    channel.subscribe()

    // Fallback: poll every 30 seconds just in case Realtime isn't enabled in Supabase yet
    const intervalId = setInterval(() => {
      router.refresh()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(intervalId)
    }
  }, [supabase, router, userId])

  return null
}
