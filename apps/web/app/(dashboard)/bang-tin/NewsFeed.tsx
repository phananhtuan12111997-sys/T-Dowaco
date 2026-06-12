'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { NewsPost } from './NewsPost'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function NewsFeed({ initialPosts, currentUserId, isITAdmin }: { initialPosts: any[], currentUserId: string, isITAdmin?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  
  const [posts, setPosts] = useState<any[]>(initialPosts || [])
  const [searchTerm, setSearchTerm] = useState(q)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10)
  
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const supabase = createClient()

  // Lưu trữ timeout để debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Khi initialPosts thay đổi (do SSR query lại), cập nhật state và reset page
  useEffect(() => {
    setPosts(initialPosts)
    setPage(1)
    setHasMore(initialPosts.length >= 10)
  }, [initialPosts])

  // Lấy avatar của current user để dùng cho bình luận
  useEffect(() => {
    const fetchAvatar = async () => {
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', currentUserId).single()
      if (data) setCurrentUserAvatar(data.avatar_url)
    }
    fetchAvatar()
  }, [currentUserId, supabase])

  // Realtime subscription
  useEffect(() => {
    const refetchCurrentPosts = async () => {
      // Fetch số lượng bài đúng bằng số lượng đã tải
      const limit = page * 10
      let query = supabase
        .from('news')
        .select(`
          *,
          attachments:news_attachments(*),
          reactions:news_reactions(*),
          comments:news_comments(
            *,
            reactions:news_comment_reactions(*)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (q) {
        query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      }
      
      const { data } = await query
      
      if (data) {
        const userIds = new Set<string>()
        data.forEach(post => {
          userIds.add(post.author_id)
          post.comments?.forEach((c: any) => userIds.add(c.user_id))
        })
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', Array.from(userIds))
          
        const profileMap: Record<string, string> = {}
        profiles?.forEach(p => {
          profileMap[p.id] = p.avatar_url
        })
        
        const enrichedData = data.map(post => ({
          ...post,
          author_avatar: profileMap[post.author_id],
          comments: post.comments?.map((c: any) => ({
            ...c,
            author_avatar: profileMap[c.user_id]
          }))
        }))
        
        setPosts(enrichedData)
      }
    }

    const channel = supabase.channel('realtime-news')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        refetchCurrentPosts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_reactions' }, () => {
        refetchCurrentPosts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_comments' }, () => {
        refetchCurrentPosts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_comment_reactions' }, () => {
        refetchCurrentPosts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [page, q, supabase])

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (val) {
        params.set('q', val)
      } else {
        params.delete('q')
      }
      router.push(`?${params.toString()}`)
    }, 500)
  }

  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    const from = (nextPage - 1) * 10
    const to = from + 9

    let query = supabase
      .from('news')
      .select(`
        *,
        attachments:news_attachments(*),
        reactions:news_reactions(*),
        comments:news_comments(
          *,
          reactions:news_comment_reactions(*)
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (q) {
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    }

    const { data } = await query

    if (data && data.length > 0) {
      const userIds = new Set<string>()
      data.forEach(post => {
        userIds.add(post.author_id)
        post.comments?.forEach((c: any) => userIds.add(c.user_id))
      })
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', Array.from(userIds))
        
      const profileMap: Record<string, string> = {}
      profiles?.forEach(p => {
        profileMap[p.id] = p.avatar_url
      })
      
      const enrichedData = data.map(post => ({
        ...post,
        author_avatar: profileMap[post.author_id],
        comments: post.comments?.map((c: any) => ({
          ...c,
          author_avatar: profileMap[c.user_id]
        }))
      }))

      setPosts(prev => [...prev, ...enrichedData])
      setPage(nextPage)
      setHasMore(data.length === 10)
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <Input
          type="search"
          placeholder="Tìm kiếm bài viết, tác giả..."
          className="pl-10 h-12 bg-white border-slate-200 rounded-full shadow-sm text-base focus-visible:ring-blue-500"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {posts.length > 0 ? (
          <>
            {posts.map(post => (
              <NewsPost 
                key={post.id} 
                post={post} 
                currentUserId={currentUserId} 
                currentUserAvatar={currentUserAvatar}
                isITAdmin={isITAdmin}
              />
            ))}
            
            {hasMore && (
              <div className="pt-4 pb-8 flex justify-center">
                <Button 
                  variant="outline" 
                  className="bg-white border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-8 rounded-full shadow-sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loadingMore ? 'Đang tải...' : 'Tải thêm bài viết'}
                </Button>
              </div>
            )}
            
            {!hasMore && posts.length > 0 && (
              <div className="pt-4 pb-8 text-center text-sm text-slate-400">
                Đã hiển thị tất cả bài viết.
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-400 mb-2">Không tìm thấy bài viết nào.</div>
          </div>
        )}
      </div>
    </div>
  )
}
