'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { NewsPost } from './NewsPost'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function NewsFeed({ initialPosts, currentUserId, isITAdmin }: { initialPosts: any[], currentUserId: string, isITAdmin?: boolean }) {
  const [posts, setPosts] = useState<any[]>(initialPosts || [])
  const [search, setSearch] = useState('')
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Refresh posts to get comments and reactions nested properly
    // Instead of doing complex joins on client, we fetch on mount or listen to simple changes
    // A robust way is listening to changes and re-fetching the specific post or the whole feed.
    const fetchPosts = async () => {
      const { data } = await supabase
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
      
      if (data) {
        const userIds = new Set<string>()
        data.forEach(post => {
          userIds.add(post.author_id)
          post.comments?.forEach((c: any) => userIds.add(c.user_id))
        })
        userIds.add(currentUserId)
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', Array.from(userIds))
          
        const profileMap: Record<string, string> = {}
        profiles?.forEach(p => {
          profileMap[p.id] = p.avatar_url
        })
        
        setCurrentUserAvatar(profileMap[currentUserId] || null)
        
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

    fetchPosts() // Initial fresh fetch

    const channel = supabase.channel('realtime-news')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        fetchPosts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_reactions' }, () => {
        fetchPosts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_comments' }, () => {
        fetchPosts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_comment_reactions' }, () => {
        fetchPosts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredPosts = posts.filter(post => 
    post.title?.toLowerCase().includes(search.toLowerCase()) ||
    post.content?.toLowerCase().includes(search.toLowerCase()) ||
    post.author_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <Input
          type="search"
          placeholder="Tìm kiếm bài viết, tác giả..."
          className="pl-10 h-12 bg-white border-slate-200 rounded-full shadow-sm text-base focus-visible:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <NewsPost 
            key={post.id} 
            post={post} 
            currentUserId={currentUserId} 
            currentUserAvatar={currentUserAvatar}
            isITAdmin={isITAdmin}
          />
          ))
        ) : (
          <div className="text-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-400 mb-2">Không tìm thấy bài viết nào.</div>
          </div>
        )}
      </div>
    </div>
  )
}
