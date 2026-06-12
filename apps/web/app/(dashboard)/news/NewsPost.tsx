'use client'

import { useState, useTransition, useOptimistic } from 'react'
import Image from 'next/image'
import { User, MessageCircle, MoreHorizontal, FileText, Download, X, Pencil, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { ReactionPicker, getReactionIcon } from './ReactionPicker'
import { CommentSection } from './CommentSection'
import { toggleReaction } from './actions'

export function NewsPost({ post, currentUserId, currentUserAvatar, isITAdmin }: { post: any, currentUserId: string, currentUserAvatar?: string | null, isITAdmin?: boolean }) {
  const [showComments, setShowComments] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn xoá bài viết này?')) {
      const { deleteNews } = await import('./actions')
      const res = await deleteNews(post.id)
      if (res?.error) {
        alert(res.error)
      }
    }
  }

  const [optimisticReactions, addOptimisticReaction] = useOptimistic(
    post.reactions || [],
    (state: any[], newReaction: any) => {
      const exists = state.find((r) => r.user_id === currentUserId)
      if (exists && exists.type === newReaction.type) {
        return state.filter((r) => r.user_id !== currentUserId)
      }
      return [...state.filter((r) => r.user_id !== currentUserId), newReaction]
    }
  )

  const handleReact = (type: string) => {
    setShowPicker(false)
    startTransition(() => {
      addOptimisticReaction({ user_id: currentUserId, type })
      toggleReaction(post.id, type)
    })
  }

  const myReaction = optimisticReactions?.find((r: any) => r.user_id === currentUserId)
  const myReactionIcon = myReaction ? getReactionIcon(myReaction.type) : null

  // Process attachments
  const images = post.attachments?.filter((a: any) => a.type.startsWith('image/')) || []
  const files = post.attachments?.filter((a: any) => !a.type.startsWith('image/')) || []

  // Group reactions for summary
  const topReactions = optimisticReactions?.reduce((acc: any, curr: any) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1
    return acc
  }, {})
  
  const sortedReactions = Object.entries(topReactions || {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)

  return (
    <>
      {/* Full screen image viewer */}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setViewingImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
            <Image 
              src={viewingImage} 
              alt="Full size" 
              fill
              className="object-contain select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden shrink-0 relative">
              {post.author_avatar ? (
                <Image src={post.author_avatar} alt={post.author_name} fill className="object-cover" sizes="40px" />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-800 leading-tight">{post.author_name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {new Date(post.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          {(post.author_id === currentUserId || isITAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {post.author_id === currentUserId && (
                  <DropdownMenuItem onClick={() => router.push(`/news/${post.id}/edit`)}>
                    <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Xoá bài
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div 
          className="px-4 pb-3 space-y-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => router.push(`/news/${post.id}`)}
        >
          <h3 className="font-bold text-slate-900 uppercase hover:underline">{post.title}</h3>
          <p className="text-slate-800 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div className={`grid gap-1 mt-2 ${
            images.length === 1 ? 'grid-cols-1' : 
            images.length === 2 ? 'grid-cols-2' : 
            images.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
          }`}>
            {images.slice(0, 4).map((img: any, i: number) => (
              <div 
                key={i} 
                className={`relative bg-slate-100 cursor-pointer ${
                  images.length === 3 && i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'
                }`}
                onClick={() => setViewingImage(img.url)}
              >
                <Image 
                  src={img.url} 
                  alt={img.name} 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {images.length > 4 && i === 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                    +{images.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Files List */}
        {files.length > 0 && (
          <div className="px-4 py-3 space-y-2">
            {files.map((file: any, i: number) => (
              <a 
                key={i} 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
              >
                <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                    {file.name}
                  </div>
                  <div className="text-xs text-slate-500 uppercase">{file.type.split('/')[1] || 'FILE'}</div>
                </div>
                <Download className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              </a>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {(optimisticReactions?.length > 0 || post.comments?.length > 0) && (
          <div className="px-4 py-2 flex items-center justify-between text-slate-500 text-sm border-b border-slate-100 mx-2">
            <div className="flex items-center gap-1.5">
              {optimisticReactions?.length > 0 && (
                <>
                  <div className="flex -space-x-1">
                    {sortedReactions.map(([type]: any) => (
                      <span key={type} className="text-sm bg-white rounded-full leading-none z-10 border border-white">
                        {getReactionIcon(type)?.icon}
                      </span>
                    ))}
                  </div>
                  <span>{optimisticReactions.length}</span>
                </>
              )}
            </div>
            <div className="flex gap-3">
              {post.comments?.length > 0 && (
                <button className="hover:underline" onClick={() => setShowComments(true)}>
                  {post.comments.length} bình luận
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-4 py-1.5 flex items-center justify-between gap-1 mx-2">
          <div 
            className="relative flex-1"
            onMouseEnter={() => setShowPicker(true)}
            onMouseLeave={() => setShowPicker(false)}
          >
            <button 
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-md hover:bg-slate-100 transition-colors font-medium text-sm ${myReactionIcon ? myReactionIcon.color : 'text-slate-600'}`}
              onClick={() => handleReact('like')}
              disabled={isPending}
            >
              {myReactionIcon ? (
                <>
                  <span className="text-lg leading-none">{myReactionIcon.icon}</span>
                  {myReactionIcon.label}
                </>
              ) : (
                <>
                  <span className="text-lg leading-none">👍</span>
                  Thích
                </>
              )}
            </button>
            
            {showPicker && <ReactionPicker onSelect={handleReact} />}
          </div>

          <button 
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md hover:bg-slate-100 transition-colors font-medium text-sm text-slate-600"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-5 w-5" />
            Bình luận
          </button>
        </div>

        {/* Comment Section */}
        {showComments && (
          <div className="border-t border-slate-100 bg-slate-50 p-4">
            <CommentSection 
              newsId={post.id} 
              currentUserId={currentUserId} 
              currentUserAvatar={currentUserAvatar}
              comments={post.comments || []} 
              isITAdmin={isITAdmin}
            />
          </div>
        )}
      </div>
    </>
  )
}
