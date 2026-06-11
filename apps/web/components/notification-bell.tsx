'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff, Calendar, Car, Briefcase, FileText, MessageSquare, Newspaper } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/app/actions/notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Notification = {
  id: string
  message: string
  is_read: boolean
  created_at: string
  document_id: string
}

const getNotificationStyle = (message: string) => {
  const msg = message.toLowerCase()
  if (msg.includes('bảng tin')) {
    return { icon: <Newspaper className="w-5 h-5 text-pink-600" />, bgClass: 'bg-pink-100' }
  }
  if (msg.includes('lịch họp')) {
    return { icon: <Calendar className="w-5 h-5 text-indigo-600" />, bgClass: 'bg-indigo-100' }
  }
  if (msg.includes('xin xe') || msg.includes('đăng ký xe') || msg.includes('chuyến đi xe')) {
    return { icon: <Car className="w-5 h-5 text-emerald-600" />, bgClass: 'bg-emerald-100' }
  }
  if (msg.includes('công việc')) {
    return { icon: <Briefcase className="w-5 h-5 text-blue-600" />, bgClass: 'bg-blue-100' }
  }
  if (msg.includes('công văn')) {
    return { icon: <FileText className="w-5 h-5 text-purple-600" />, bgClass: 'bg-purple-100' }
  }
  return { icon: <Bell className="w-5 h-5 text-slate-600" />, bgClass: 'bg-slate-100' }
}

export function NotificationBell() {
  const router = useRouter()
  const supabase = createClient()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const unreadCountRef = useRef(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null))
  }, [supabase])

  const fetchInitial = async () => {
    const data = await getNotifications(0, 5)
    setNotifications(data)
    setOffset(5)
    if (data.length < 5) setHasMore(false)
    
    const count = await getUnreadCount()
    setUnreadCount(count)
    unreadCountRef.current = count
  }

  useEffect(() => {
    if (!userId) return

    fetchInitial()

    // Fallback: poll directly from Supabase API every 15s to bypass Next.js middleware
    const intervalId = setInterval(async () => {
      if (!userId) return;
      
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (data) {
        setNotifications(data as Notification[]);
      }
      
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
        
      if (count !== null) {
        setUnreadCount(count);
      }
    }, 15000);

    return () => {
      clearInterval(intervalId);
    }

    // cleanup
  }, [userId, supabase])

  const loadMore = async () => {
    const data = await getNotifications(offset, 5)
    if (data.length > 0) {
      setNotifications(prev => [...prev, ...data])
      setOffset(prev => prev + 5)
    }
    if (data.length < 5) {
      setHasMore(false)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    
    setIsOpen(false)

    if (notif.message.includes('[Bảng tin]')) {
      // document_id is the news UUID
      if (notif.document_id) {
        router.push(`/news/${notif.document_id}`)
      }
      return
    }

    if (notif.message.includes('Lịch họp')) {
      if (notif.document_id) {
        router.push(`/meetings/${notif.document_id}`)
      } else {
        router.push(`/meetings`)
      }
      return
    }

    if (notif.message.includes('xin xe') || notif.message.includes('đăng ký xe') || notif.message.includes('chuyến đi xe')) {
      router.push(`/vehicles?id=${notif.document_id}`)
      return
    }

    if (!notif.document_id) {
      // Do nothing for system messages like deleted document
      return
    }

    if (notif.message.includes('trả lời/báo cáo')) {
      router.push(`/documents/sent/${notif.document_id}`)
    } else if (notif.message.toLowerCase().includes('công việc')) {
      if (notif.message.includes('gửi báo cáo')) {
        router.push(`/tasks/${notif.document_id}?action=approve`)
      } else if (notif.message.includes('bình luận')) {
        router.push(`/tasks/${notif.document_id}?action=comment`)
      } else {
        router.push(`/tasks/${notif.document_id}`)
      }
    } else {
      router.push(`/documents/incoming/${notif.document_id}`)
    }
  }

  // Group notifications
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayNotifs = notifications.filter(n => new Date(n.created_at) >= today)
  const earlierNotifs = notifications.filter(n => new Date(n.created_at) < today)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">Thông báo mới</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-[#a855f7] text-white px-2 py-1 rounded-md">
              {unreadCount} Chưa đọc
            </span>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.preventDefault(); handleMarkAllRead(); }}
                className="text-xs text-[#1a56db] hover:underline"
              >
                Đánh dấu đọc tất cả
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                <BellOff className="w-8 h-8 text-[#a855f7]" />
              </div>
              <p className="font-medium text-slate-600">Không có thông báo mới</p>
            </div>
          ) : (
            <div className="py-2">
              {todayNotifs.length > 0 && (
                <>
                  <div className="px-4 py-2">
                    <h4 className="text-sm font-bold text-slate-800">Hôm nay</h4>
                  </div>
                  {todayNotifs.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 hover:bg-slate-50 cursor-pointer flex gap-3 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationStyle(n.message).bgClass}`}>
                        {getNotificationStyle(n.message).icon}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm line-clamp-2 ${!n.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                          {n.message}
                        </p>
                        <p className={`text-xs ${!n.is_read ? 'font-medium text-blue-600' : 'text-slate-400'}`}>
                          {new Date(n.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[#1a56db] self-center flex-shrink-0"></div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {earlierNotifs.length > 0 && (
                <>
                  <div className="px-4 py-2 mt-2">
                    <h4 className="text-sm font-bold text-slate-800">Trước đó</h4>
                  </div>
                  {earlierNotifs.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 hover:bg-slate-50 cursor-pointer flex gap-3 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationStyle(n.message).bgClass}`}>
                        {getNotificationStyle(n.message).icon}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm line-clamp-2 ${!n.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                          {n.message}
                        </p>
                        <p className={`text-xs ${!n.is_read ? 'font-medium text-blue-600' : 'text-slate-400'}`}>
                          {new Date(n.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[#1a56db] self-center flex-shrink-0"></div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {hasMore && (
                <div className="px-4 py-3 text-center border-t border-slate-100 mt-2">
                  <button 
                    onClick={(e) => { e.preventDefault(); loadMore(); }}
                    className="text-sm font-medium text-[#1a56db] hover:underline"
                  >
                    Xem thêm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
