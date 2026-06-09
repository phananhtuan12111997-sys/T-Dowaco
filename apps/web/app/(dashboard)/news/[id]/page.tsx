import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { NewsPost } from '../NewsPost'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewsDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = params.id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: post, error } = await supabase
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
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching news post:', error)
  }

  if (!post) {
    return notFound()
  }

  // Sort comments by created_at ascending
  if (post.comments) {
    post.comments.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
  
  const userIds = new Set<string>()
  userIds.add(post.author_id)
  post.comments?.forEach((c: any) => userIds.add(c.user_id))
  userIds.add(user.id)
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, avatar_url, department, is_admin')
    .in('id', Array.from(userIds))
    
  const profileMap: Record<string, string> = {}
  profiles?.forEach(p => {
    profileMap[p.id] = p.avatar_url
  })
  
  post.author_avatar = profileMap[post.author_id]
  if (post.comments) {
    post.comments.forEach((c: any) => {
      c.author_avatar = profileMap[c.user_id]
    })
  }
  
  const currentUserAvatar = profileMap[user.id] || null
  const currentUserProfile = profiles?.find(p => p.id === user.id)
  const isITAdmin = currentUserProfile?.department === 'Phòng IT' || currentUserProfile?.is_admin

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-4">
        <Link href="/news" className="text-slate-500 hover:text-slate-800 flex items-center gap-1 w-fit">
          <ArrowLeft className="h-4 w-4" />
          Quay lại Bảng tin
        </Link>
      </div>
      <NewsPost post={post} currentUserId={user.id} currentUserAvatar={currentUserAvatar} isITAdmin={isITAdmin} />
    </div>
  )
}
