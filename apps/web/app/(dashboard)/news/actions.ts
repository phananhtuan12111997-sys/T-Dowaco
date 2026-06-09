'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAdminSupabase() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function upsertGroupedNotification(
  adminSupabase: any,
  userId: string,
  documentId: string,
  baseMessage: string,
  actorName: string,
  typeKeyword: string
) {
  const { data: existing } = await adminSupabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('document_id', documentId)
    .eq('is_read', false)
    .ilike('message', `%${typeKeyword}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    if (existing.message.includes(actorName)) {
      await adminSupabase.from('notifications').update({
        is_read: false,
        created_at: new Date().toISOString()
      }).eq('id', existing.id)
      return
    }

    let newCount = 1
    const match = existing.message.match(/và (\d+) người khác/)
    if (match) {
      newCount = parseInt(match[1]) + 1
    }

    const newMessage = `[Bảng tin] ${actorName} và ${newCount} người khác ${baseMessage}`
    await adminSupabase.from('notifications').update({
      message: newMessage,
      is_read: false,
      created_at: new Date().toISOString()
    }).eq('id', existing.id)
  } else {
    await adminSupabase.from('notifications').insert({
      user_id: userId,
      message: `[Bảng tin] ${actorName} ${baseMessage}`,
      document_id: documentId,
      is_read: false
    })
  }
}

export async function createNews(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn chưa đăng nhập')

  // Lấy thông tin user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const author_name = profile?.full_name || 'Người dùng ẩn danh'

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const attachmentsJson = formData.get('attachments') as string
  
  const attachments = attachmentsJson ? JSON.parse(attachmentsJson) : []

  if (!title || !content) {
    throw new Error('Vui lòng nhập đầy đủ tiêu đề và nội dung')
  }

  // Insert news
  const { data: newsData, error } = await supabase
    .from('news')
    .insert({
      title,
      content,
      author_name,
      author_id: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating news:', error)
    throw new Error('Lỗi đăng tin: ' + error.message)
  }

  // Insert attachments into news_attachments table
  if (attachments && attachments.length > 0) {
    const attachmentRecords = attachments.map((att: any) => ({
      news_id: newsData.id,
      name: att.name,
      url: att.url,
      type: att.type,
      size: att.size || 0
    }))
    
    const { error: attError } = await supabase.from('news_attachments').insert(attachmentRecords)
    if (attError) {
      console.error('Error inserting attachments:', attError)
    }
  }

  // Notify all users except the creator
  const { data: users } = await supabase.from('profiles').select('id')
  if (users) {
    const notifications = users
      .filter((u: any) => u.id !== user.id)
      .map((u: any) => ({
        user_id: u.id,
        message: `[Bảng tin] ${author_name} vừa đăng một tin mới: ${title}`,
        document_id: newsData.id,
        is_read: false
      }))
    
    if (notifications.length > 0) {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await adminSupabase.from('notifications').insert(notifications)
    }
  }

  // Refresh lại danh sách và trả về thành công
  revalidatePath('/news')
  return { success: true }
}

export async function toggleReaction(newsId: string, type: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if reaction exists
  const { data: existing } = await supabase
    .from('news_reactions')
    .select('*')
    .eq('news_id', newsId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.type === type) {
      // Remove reaction if clicking the same one
      await supabase.from('news_reactions').delete().eq('id', existing.id)
    } else {
      // Update reaction type
      await supabase.from('news_reactions').update({ type }).eq('id', existing.id)
    }
  } else {
    // Add new reaction
    await supabase.from('news_reactions').insert({
      news_id: newsId,
      user_id: user.id,
      type
    })

    // Notify author
    const { data: news } = await supabase.from('news').select('author_id, title').eq('id', newsId).single()
    if (news && news.author_id !== user.id) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const actorName = profile?.full_name || 'Ai đó'
      const adminSupabase = await getAdminSupabase()
      
      await upsertGroupedNotification(
        adminSupabase,
        news.author_id,
        newsId,
        'đã bày tỏ cảm xúc về bài viết của bạn.',
        actorName,
        'bày tỏ cảm xúc về bài viết'
      )
    }
  }

  revalidatePath('/news')
}

export async function addComment(newsId: string, content: string, parentId?: string | null, imageUrl?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Lấy tên user
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const author_name = profile?.full_name || 'Người dùng ẩn danh'

  const { data: comment, error } = await supabase
    .from('news_comments')
    .insert({
      news_id: newsId,
      user_id: user.id,
      author_name,
      content,
      parent_id: parentId || null,
      image_url: imageUrl || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return { error: 'Failed to add comment' }
  }

  // Handle notifications
  const commenterName = author_name
  const adminSupabase = await getAdminSupabase()
  
  if (parentId) {
    // Reply: Notify the parent comment author
    const { data: parentComment } = await supabase.from('news_comments').select('user_id').eq('id', parentId).single()
    if (parentComment && parentComment.user_id !== user.id) {
      await upsertGroupedNotification(
        adminSupabase,
        parentComment.user_id,
        newsId,
        'đã trả lời bình luận của bạn.',
        commenterName,
        'trả lời bình luận'
      )
    }
  } else {
    // Top-level comment: Notify news author
    const { data: news } = await supabase.from('news').select('author_id').eq('id', newsId).single()
    if (news && news.author_id !== user.id) {
      await upsertGroupedNotification(
        adminSupabase,
        news.author_id,
        newsId,
        'đã bình luận về bài viết của bạn.',
        commenterName,
        'bình luận về bài viết'
      )
    }
  }

  // Handle Mentions: Check if content includes @fullName
  const { data: allUsers } = await adminSupabase.from('profiles').select('id, full_name')
  if (allUsers && allUsers.length > 0) {
    for (const u of allUsers) {
      if (u.id !== user.id && content.includes(`@${u.full_name}`)) {
        await upsertGroupedNotification(
          adminSupabase,
          u.id,
          newsId,
          'đã nhắc đến bạn trong một bình luận.',
          commenterName,
          'nhắc đến bạn'
        )
      }
    }
  }

  revalidatePath('/news')
  return { success: true }
}

export async function toggleCommentReaction(commentId: string, type: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: existing } = await supabase
    .from('news_comment_reactions')
    .select('*')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.type === type) {
      await supabase.from('news_comment_reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('news_comment_reactions').update({ type }).eq('id', existing.id)
    }
  } else {
    await supabase.from('news_comment_reactions').insert({
      comment_id: commentId,
      user_id: user.id,
      type
    })

    // Notify comment author
    const { data: comment } = await supabase.from('news_comments').select('user_id, news_id').eq('id', commentId).single()
    if (comment && comment.user_id !== user.id) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const actorName = profile?.full_name || 'Ai đó'
      const adminSupabase = await getAdminSupabase()

      await upsertGroupedNotification(
        adminSupabase,
        comment.user_id,
        comment.news_id,
        'đã bày tỏ cảm xúc về bình luận của bạn.',
        actorName,
        'bày tỏ cảm xúc về bình luận'
      )
    }
  }

  revalidatePath('/news')
}

export async function deleteNews(newsId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: news } = await supabase.from('news').select('author_id').eq('id', newsId).single()
  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin

  if (!news || (news.author_id !== user.id && !isITAdmin)) {
    return { error: 'Forbidden' }
  }

  // Create admin client to bypass RLS during cascade delete
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminSupabase.from('news').delete().eq('id', newsId)
  if (error) {
    console.error('Error deleting news:', error)
    return { error: 'Lỗi khi xoá bài: ' + error.message }
  }

  revalidatePath('/news')
  return { success: true }
}

export async function editNews(newsId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: news } = await supabase.from('news').select('author_id').eq('id', newsId).single()
  if (!news || news.author_id !== user.id) {
    return { error: 'Forbidden' }
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const attachmentsJson = formData.get('attachments') as string

  const { error } = await supabase.from('news').update({ title, content }).eq('id', newsId)
  if (error) {
    console.error('Error updating news:', error)
    return { error: 'Failed to update news' }
  }

  if (attachmentsJson) {
    const attachments = JSON.parse(attachmentsJson)
    if (attachments.length > 0) {
      const attachmentsData = attachments.map((a: any) => ({
        news_id: newsId,
        name: a.name,
        url: a.url,
        type: a.type
      }))
      await supabase.from('news_attachments').insert(attachmentsData)
    }
  }

  revalidatePath('/news')
  return { success: true }
}

export async function editComment(commentId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: comment } = await supabase.from('news_comments').select('*').eq('id', commentId).single()
  if (!comment || comment.user_id !== user.id) {
    return { error: 'Forbidden' }
  }

  const history = comment.edit_history || []
  history.push({
    content: comment.content,
    edited_at: new Date().toISOString()
  })

  const { error } = await supabase
    .from('news_comments')
    .update({ 
      content, 
      is_edited: true,
      edit_history: history
    })
    .eq('id', commentId)

  if (error) return { error: 'Failed to update' }
  revalidatePath('/news')
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: comment } = await supabase.from('news_comments').select('user_id').eq('id', commentId).single()
  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin

  if (!comment || (comment.user_id !== user.id && !isITAdmin)) {
    return { error: 'Forbidden' }
  }

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await adminSupabase.from('news_comments').delete().eq('parent_id', commentId)
  const { error } = await adminSupabase.from('news_comments').delete().eq('id', commentId)

  if (error) return { error: 'Failed to delete' }
  revalidatePath('/news')
  return { success: true }
}
