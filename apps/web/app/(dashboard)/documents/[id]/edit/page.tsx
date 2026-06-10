import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditDocumentForm } from './edit-document-form'
import { getUsers } from '@/app/(dashboard)/documents/create/actions'

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  const documentId = (await params).id

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch document
  const { data: doc, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (error || !doc) {
    console.error('Error fetching document for edit:', error)
    notFound()
  }

  // Fetch profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .single()

  // Security check: Only the sender or Admin can edit
  if (doc.created_by !== userData.user.id && !profile?.is_admin) {
    redirect('/documents/sent')
  }

  // Fetch users for selection
  const users = await getUsers()

  // Fetch recipients
  const { data: recipientsData } = await supabaseAdmin
    .from('document_recipients')
    .select('user_id')
    .eq('document_id', documentId)

  const recipientIds = recipientsData?.map(r => r.user_id) || []
  
  // Convert recipientIds to User objects
  const initialRecipients = users.filter(u => recipientIds.includes(u.id))

  return (
    <div className="w-full max-w-6xl mx-auto pb-10">
      <EditDocumentForm 
        users={users} 
        currentUserId={userData.user.id} 
        documentId={doc.id}
        initialData={{
          ...doc,
          selectedUsers: initialRecipients
        }}
      />
    </div>
  )
}
