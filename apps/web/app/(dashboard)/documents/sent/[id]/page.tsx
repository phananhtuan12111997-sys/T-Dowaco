import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentDetailsClient } from '../../incoming/[id]/document-details-client'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export default async function SentDocumentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const documentId = params.id
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null
  const currentUserId = userData.user.id

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', currentUserId)
    .single()
  
  const isAdmin = currentUserProfile?.is_admin

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch Document
  const { data: document } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (!document) return notFound()

  // Fetch Recipients
  const { data: recipientsData } = await supabaseAdmin
    .from('document_recipients')
    .select('*')
    .eq('document_id', documentId)

  const recipients = recipientsData || []

  // Check access: Is current user the assigner, or a recipient?
  const isAssigner = document.created_by === currentUserId
  const isRecipient = recipients.some(r => r.user_id === currentUserId)
  
  if (!isAssigner && !isRecipient && !isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-slate-500">Bạn không có quyền xem công văn này.</p>
      </div>
    )
  }

  // Mar as read
  if (isRecipient) {
    const r = recipients.find(r => r.user_id === currentUserId)
    if (r && r.status !== 'Đã xem') {
      await supabaseAdmin
        .from('document_recipients')
        .update({ 
          status: 'Đã xem',
          viewed_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
        .eq('user_id', currentUserId)
    }
  }

  // Fetch Comments (Timeline)
  const { data: commentsData } = await supabaseAdmin
    .from('document_comments')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  const comments = commentsData || []

  // Fetch Profiles for everyone involved
  const userIds = new Set<string>()
  if (document.created_by) userIds.add(document.created_by)
  recipients.forEach(r => {
    userIds.add(r.user_id)
    if (r.forwarded_from) userIds.add(r.forwarded_from)
  })
  comments.forEach(c => userIds.add(c.user_id))

  const { data: profilesData } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, department, avatar_url')
    .in('id', Array.from(userIds))

  const profilesMap = new Map((profilesData || []).map(p => [p.id, p]))

  // Enrich data
  const enrichedDocument = {
    ...document,
    assigner_name: profilesMap.get(document.created_by)?.full_name || 'Không rõ',
    assigner_role: profilesMap.get(document.created_by)?.role,
  }

  const enrichedRecipients = recipients.map(r => ({
    ...r,
    user_name: profilesMap.get(r.user_id)?.full_name || 'Không rõ',
    user_role: profilesMap.get(r.user_id)?.role,
    user_department: profilesMap.get(r.user_id)?.department,
    forwarded_from_name: r.forwarded_from ? profilesMap.get(r.forwarded_from)?.full_name : null,
  }))

  const enrichedComments = comments.map(c => ({
    ...c,
    user_name: profilesMap.get(c.user_id)?.full_name || 'Không rõ',
    user_avatar: profilesMap.get(c.user_id)?.avatar_url || null,
  }))

  const currentUserRecipient = enrichedRecipients.find(r => r.user_id === currentUserId)

  return (
    <>
      <RealtimeRefresh tables={['document_comments', 'document_recipients']} />
      <DocumentDetailsClient 
        document={enrichedDocument}
        recipients={enrichedRecipients}
        comments={enrichedComments}
        currentUserId={currentUserId}
        isAssigner={isAssigner}
        currentUserRecipient={currentUserRecipient}
      />
    </>
  )
}
