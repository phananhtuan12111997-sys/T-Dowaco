'use client'

import { useState, useTransition, useRef, useOptimistic } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, CornerDownRight, Loader2, Image as ImageIcon, X, MoreHorizontal, Pencil, Trash2, History } from 'lucide-react'
import { addComment, toggleCommentReaction } from './actions'
import { getReactionIcon, ReactionPicker } from './ReactionPicker'
import { createClient } from '@/utils/supabase/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEffect } from 'react'

function MentionDropdown({ text, onSelect, users }: { text: string, onSelect: (val: string) => void, users: any[] }) {
  const match = text.match(/@([a-zA-Z0-9À-ỹ\s_]*)$/)
  if (!match) return null
  const query = (match[1] || "").toLowerCase()
  const filtered = users.filter(u => u.full_name.toLowerCase().includes(query)).slice(0, 5)
  
  if (filtered.length === 0) return null

  return (
    <div className="absolute bottom-full left-4 mb-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
      {filtered.map(u => (
        <button
          key={u.id}
          type="button"
          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault()
            const newText = text.replace(/@[a-zA-Z0-9À-ỹ\s_]*$/, `@${u.full_name} `)
            onSelect(newText)
          }}
        >
          <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
            {u.avatar_url ? (
              <Image src={u.avatar_url} alt={u.full_name} fill className="object-cover" sizes="24px" />
            ) : (
              <User className="h-3 w-3 text-slate-500" />
            )}
          </div>
          <span className="font-medium text-slate-700">{u.full_name}</span>
        </button>
      ))}
    </div>
  )
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Vừa xong'
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} phút`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} giờ`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} ngày`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks} tuần`
  
  const currentYear = now.getFullYear()
  const dateYear = date.getFullYear()
  
  if (currentYear === dateYear) {
    return `${date.getDate()} thg ${date.getMonth() + 1}`
  }
  
  return `${date.getDate()} thg ${date.getMonth() + 1}, ${dateYear}`
}

export function CommentSection({ newsId, comments, currentUserId, currentUserAvatar, isITAdmin }: { newsId: string, comments: any[], currentUserId: string, currentUserAvatar?: string | null, isITAdmin?: boolean }) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state: any[], newComment: any) => {
      return [...state, newComment]
    }
  )
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, avatar_url').then(({ data }) => {
      if (data) setUsers(data)
    })
  }, [supabase])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `comment_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage.from('news_attachments').upload(fileName, file)
    if (error) throw error
    const { data: publicUrlData } = supabase.storage.from('news_attachments').getPublicUrl(fileName)
    return publicUrlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null, localImageFile: File | null = null, localContent: string = '') => {
    e.preventDefault()
    const textToSubmit = parentId ? localContent : content
    const imgToSubmit = parentId ? localImageFile : imageFile
    
    if (!textToSubmit.trim() && !imgToSubmit) return

    setUploading(true)
    try {
      let imageUrl = null
      if (imgToSubmit) {
        imageUrl = await uploadImage(imgToSubmit)
      }

      startTransition(async () => {
        addOptimisticComment({
          id: Math.random().toString(),
          content: textToSubmit,
          image_url: imageUrl,
          parent_id: parentId,
          author_id: currentUserId,
          author_name: 'Bạn',
          author_avatar: currentUserAvatar,
          created_at: new Date().toISOString()
        })
        await addComment(newsId, textToSubmit, parentId, imageUrl)
        if (!parentId) {
          setContent('')
          setImageFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
        setReplyingTo(null)
      })
    } catch (error: any) {
      alert('Lỗi upload ảnh: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // Organize comments into parent/child structure
  const topLevelComments = optimisticComments.filter(c => !c.parent_id)
  const replies = optimisticComments.filter(c => c.parent_id)

  return (
    <div className="pt-4 border-t border-slate-100">
      {/* Full screen comment image viewer */}
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
              alt="Full size comment" 
              fill
              className="object-contain select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="space-y-4 mb-4">
        {topLevelComments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            replies={replies.filter(r => r.parent_id === comment.id)}
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
            onReply={() => setReplyingTo(comment.id)}
            isReplying={replyingTo === comment.id}
            onSubmitReply={handleSubmit}
            isPending={isPending || uploading}
            onViewImage={setViewingImage}
            users={users}
            isITAdmin={isITAdmin}
          />
        ))}
      </div>

      {!replyingTo && (
        <div className="space-y-2">
          {imageFile && (
            <div className="ml-10 relative inline-block">
              <img src={URL.createObjectURL(imageFile)} alt="preview" className="h-24 w-auto rounded-lg border border-slate-200 object-cover" />
              <button 
                onClick={() => setImageFile(null)}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <form onSubmit={(e) => handleSubmit(e, null)} className="flex gap-2 items-center">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative">
              {currentUserAvatar ? (
                <Image src={currentUserAvatar} alt="Avatar" fill className="object-cover" sizes="32px" />
              ) : (
                <User className="h-4 w-4 text-slate-500" />
              )}
            </div>
            <div className="flex-1 flex gap-1 relative">
              <MentionDropdown text={content} onSelect={setContent} users={users} />
              <Input 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Viết bình luận... (Dùng @ để gắn thẻ)"
                className="rounded-full bg-slate-100 border-transparent focus-visible:ring-slate-300 focus-visible:bg-white pr-12"
                disabled={isPending || uploading}
              />
              <button 
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || uploading}
                title="Đính kèm ảnh"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageSelect}
              />
            </div>
            <Button type="submit" size="sm" className="rounded-full px-4" disabled={(!content.trim() && !imageFile) || isPending || uploading}>
              {isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gửi'}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

function CommentItem({ comment, replies, currentUserId, currentUserAvatar, onReply, isReplying, onSubmitReply, isPending, onViewImage, users, isITAdmin }: any) {
  const [showPicker, setShowPicker] = useState(false)
  const [isReacting, startReacting] = useTransition()
  
  // Edit and delete state
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content || '')
  const [showHistory, setShowHistory] = useState(false)

  // Local state for reply
  const [replyContent, setReplyContent] = useState('')
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const replyFileInputRef = useRef<HTMLInputElement>(null)

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false)
      return
    }
    const { editComment } = await import('./actions')
    startReacting(async () => {
      await editComment(comment.id, editContent)
      setIsEditing(false)
    })
  }

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn xoá bình luận này?')) {
      const { deleteComment } = await import('./actions')
      startReacting(async () => {
        await deleteComment(comment.id)
      })
    }
  }

  const handleReact = (type: string) => {
    setShowPicker(false)
    startReacting(() => {
      toggleCommentReaction(comment.id, type)
    })
  }

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmitReply(e, comment.id, replyImage, replyContent)
  }

  const handleReplyImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReplyImage(e.target.files[0])
    }
  }

  const myReaction = comment.reactions?.find((r: any) => r.user_id === currentUserId)
  const myReactionIcon = myReaction ? getReactionIcon(myReaction.type) : null

  return (
    <div className="space-y-2">
      <div className="flex gap-2 group">
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1 overflow-hidden relative">
          {comment.author_avatar ? (
            <Image src={comment.author_avatar} alt={comment.author_name} fill className="object-cover" sizes="32px" />
          ) : (
            <User className="h-4 w-4 text-slate-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex-1 max-w-full bg-slate-100 rounded-2xl px-3 py-2">
                <div className="font-semibold text-sm text-slate-800 mb-1">{comment.author_name}</div>
                <Input
                  autoFocus
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="h-8 text-sm bg-white"
                  disabled={isReacting}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => setIsEditing(false)}>Hủy</button>
                  <button type="submit" className="text-xs text-blue-600 font-semibold hover:underline" disabled={isReacting}>Lưu</button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-100 rounded-2xl px-3 py-2 inline-block max-w-full">
                <div className="font-semibold text-sm text-slate-800">{comment.author_name}</div>
                {comment.content && <div className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</div>}
              </div>
            )}
            
            {!isEditing && (comment.user_id === currentUserId || isITAdmin) && (
              <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    {comment.user_id === currentUserId && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Sửa
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" /> Xoá
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {comment.image_url && !isEditing && (
            <div className="mt-1 ml-1 cursor-pointer relative h-32 w-auto max-w-xs" onClick={() => onViewImage(comment.image_url)}>
              <img src={comment.image_url} alt="Comment attachment" className="h-32 w-auto max-w-xs object-cover rounded-xl border border-slate-200 hover:opacity-90 transition-opacity" />
            </div>
          )}
          
          {!isEditing && (
          <div className="flex items-center gap-3 mt-1 ml-2 text-xs font-medium text-slate-500 relative">
            <div 
              className="relative"
              onMouseEnter={() => setShowPicker(true)}
              onMouseLeave={() => setShowPicker(false)}
            >
              <button 
                className={`hover:underline ${myReactionIcon ? myReactionIcon.color : 'text-slate-500'}`}
                onClick={() => handleReact('like')}
              >
                {myReactionIcon ? myReactionIcon.label : 'Thích'}
              </button>
              {showPicker && <ReactionPicker onSelect={handleReact} />}
            </div>
            
            <button className="hover:underline text-slate-500" onClick={onReply}>
              Phản hồi
            </button>
            <span className="text-slate-400 font-normal text-xs">{formatTimeAgo(comment.created_at)}</span>
            {comment.is_edited && (
              <button 
                className="text-slate-400 font-normal hover:underline text-xs" 
                onClick={() => setShowHistory(true)}
              >
                Đã chỉnh sửa
              </button>
            )}
            
            {comment.reactions?.length > 0 && (
              <div className="flex items-center gap-1 bg-white shadow-sm border border-slate-100 rounded-full px-1.5 py-0.5 ml-2 absolute -right-2 -bottom-2 z-10">
                <span className="text-xs leading-none">{getReactionIcon(comment.reactions[0].type)?.icon}</span>
                <span className="text-[10px]">{comment.reactions.length}</span>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies?.length > 0 && (
        <div className="pl-10 space-y-3 mt-2">
          {replies.map((reply: any) => (
            <ReplyItem 
              key={reply.id} 
              reply={reply} 
              currentUserId={currentUserId} 
              onViewImage={onViewImage} 
              onReply={onReply}
              isITAdmin={isITAdmin}
            />
          ))}
        </div>
      )}

      {/* Reply Input */}
      {isReplying && (
        <div className="pl-10 mt-2 space-y-2">
          {replyImage && (
            <div className="ml-8 relative inline-block">
              <img src={URL.createObjectURL(replyImage)} alt="preview" className="h-20 w-auto rounded-lg border border-slate-200 object-cover" />
              <button 
                onClick={() => setReplyImage(null)}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <form onSubmit={handleReplySubmit} className="flex gap-2 items-center">
            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative">
              {currentUserAvatar ? (
                <Image src={currentUserAvatar} alt="Avatar" fill className="object-cover" sizes="24px" />
              ) : (
                <User className="h-3 w-3 text-slate-500" />
              )}
            </div>
            <div className="flex-1 flex gap-1 relative">
              <MentionDropdown text={replyContent} onSelect={setReplyContent} users={users} />
              <Input 
                autoFocus
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Viết phản hồi... (Dùng @ để gắn thẻ)"
                className="h-8 rounded-full bg-slate-100 border-transparent text-sm pr-10"
                disabled={isPending}
              />
              <button 
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                onClick={() => replyFileInputRef.current?.click()}
                disabled={isPending}
                title="Đính kèm ảnh"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={replyFileInputRef} 
                onChange={handleReplyImageSelect}
              />
            </div>
            <Button type="submit" size="sm" className="h-8 rounded-full px-3" disabled={(!replyContent.trim() && !replyImage) || isPending}>
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CornerDownRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
      
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lịch sử chỉnh sửa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {(comment.edit_history || []).map((history: any, index: number) => (
              <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">
                  {new Date(history.edited_at).toLocaleString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{history.content}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReplyItem({ reply, currentUserId, onViewImage, onReply, isITAdmin }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(reply.content || '')
  const [showHistory, setShowHistory] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleReact = (type: string) => {
    setShowPicker(false)
    startTransition(() => {
      toggleCommentReaction(reply.id, type)
    })
  }

  const myReaction = reply.reactions?.find((r: any) => r.user_id === currentUserId)
  const myReactionIcon = myReaction ? getReactionIcon(myReaction.type) : null

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContent.trim() || editContent === reply.content) {
      setIsEditing(false)
      return
    }
    const { editComment } = await import('./actions')
    startTransition(async () => {
      await editComment(reply.id, editContent)
      setIsEditing(false)
    })
  }

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn xoá bình luận này?')) {
      const { deleteComment } = await import('./actions')
      startTransition(async () => {
        await deleteComment(reply.id)
      })
    }
  }

  return (
    <div className="flex gap-2 group">
      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1 overflow-hidden relative">
        {reply.author_avatar ? (
          <Image src={reply.author_avatar} alt={reply.author_name} fill className="object-cover" sizes="24px" />
        ) : (
          <User className="h-3 w-3 text-slate-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex-1 max-w-full bg-slate-100 rounded-2xl px-3 py-2">
              <div className="font-semibold text-xs text-slate-800 mb-1">{reply.author_name}</div>
              <Input
                autoFocus
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="h-7 text-xs bg-white"
                disabled={isPending}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="text-[10px] text-slate-500 hover:underline" onClick={() => setIsEditing(false)}>Hủy</button>
                <button type="submit" className="text-[10px] text-blue-600 font-semibold hover:underline" disabled={isPending}>Lưu</button>
              </div>
            </form>
          ) : (
            <div className="bg-slate-100 rounded-2xl px-3 py-2 inline-block max-w-full">
              <div className="font-semibold text-xs text-slate-800">{reply.author_name}</div>
              {reply.content && <div className="text-sm text-slate-700 whitespace-pre-wrap">{reply.content}</div>}
            </div>
          )}
          
          {!isEditing && (reply.user_id === currentUserId || isITAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="invisible group-hover:visible p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {reply.user_id === currentUserId && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Xoá
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {reply.image_url && !isEditing && (
          <div className="mt-1 ml-1 cursor-pointer" onClick={() => onViewImage(reply.image_url)}>
            <img src={reply.image_url} alt="Reply attachment" className="h-24 w-auto max-w-[200px] object-cover rounded-xl border border-slate-200 hover:opacity-90 transition-opacity" />
          </div>
        )}
        
        {!isEditing && (
          <div className="flex items-center gap-3 mt-1 ml-2 text-[10px] font-medium text-slate-500 relative">
            <div 
              className="relative"
              onMouseEnter={() => setShowPicker(true)}
              onMouseLeave={() => setShowPicker(false)}
            >
              <button 
                className={`hover:underline ${myReactionIcon ? myReactionIcon.color : 'text-slate-500'}`}
                onClick={() => handleReact('like')}
              >
                {myReactionIcon ? myReactionIcon.label : 'Thích'}
              </button>
              {showPicker && <ReactionPicker onSelect={handleReact} />}
            </div>
            
            <button className="hover:underline text-slate-500" onClick={onReply}>
              Phản hồi
            </button>
            <span className="text-slate-400 font-normal text-xs">{formatTimeAgo(reply.created_at)}</span>
            {reply.is_edited && (
              <button 
                className="text-slate-400 font-normal hover:underline" 
                onClick={() => setShowHistory(true)}
              >
                Đã chỉnh sửa
              </button>
            )}

            {reply.reactions?.length > 0 && (
              <div className="flex items-center gap-1 bg-white shadow-sm border border-slate-100 rounded-full px-1.5 py-0.5 ml-2 absolute -right-2 -bottom-2 z-10">
                <span className="text-[10px] leading-none">{getReactionIcon(reply.reactions[0].type)?.icon}</span>
                <span className="text-[10px]">{reply.reactions.length}</span>
              </div>
            )}
          </div>
        )}

        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lịch sử chỉnh sửa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {(reply.edit_history || []).map((history: any, index: number) => (
                <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">
                    {new Date(history.edited_at).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">{history.content}</div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
