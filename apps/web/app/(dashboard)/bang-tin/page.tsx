import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewsFeed } from './NewsFeed'

export default async function NewsPage(props: any) {
  const searchParams = await props.searchParams || {}
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('department, is_admin')
    .eq('id', user.id)
    .single()

  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin
  const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch')
  const canPostNews = profile?.is_admin || isHR

  const q = typeof searchParams.q === 'string' ? searchParams.q : ''

  // Fetch initial posts (SSR)
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
    .limit(10)

  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
  }

  const { data: initialPostsData } = await query

  let initialPosts = initialPostsData || []

  if (initialPosts.length > 0) {
    const userIds = new Set<string>()
    initialPosts.forEach((post: any) => {
      userIds.add(post.author_id)
      post.comments?.forEach((c: any) => userIds.add(c.user_id))
    })
    userIds.add(user.id)
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .in('id', Array.from(userIds))
      
    const profileMap: Record<string, string> = {}
    profiles?.forEach(p => {
      profileMap[p.id] = p.avatar_url
    })
    
    initialPosts = initialPosts.map((post: any) => ({
      ...post,
      author_avatar: profileMap[post.author_id] || null,
      comments: post.comments?.map((c: any) => ({
        ...c,
        author_avatar: profileMap[c.user_id] || null
      }))
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-2xl mx-auto mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>LKWA</span>
            <span>→</span>
            <span>Bảng tin nội bộ</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a56db]">Bản tin công ty</h1>
        </div>
        
        {canPostNews && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto shadow-sm rounded-full px-6 text-white">
            <Link href="/bang-tin/create">
              <Plus className="mr-2 h-4 w-4" /> Đăng tin mới
            </Link>
          </Button>
        )}
      </div>

      <NewsFeed 
        initialPosts={initialPosts} 
        currentUserId={user.id} 
        isITAdmin={isITAdmin} 
      />
    </div>
  )
}
