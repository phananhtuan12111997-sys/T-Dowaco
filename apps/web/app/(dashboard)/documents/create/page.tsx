import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreateDocumentForm } from './create-document-form'
import { getUsers } from './actions'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { getDocumentDetails } from '../incoming/[id]/actions'

export default async function CreateDocumentPage({
  searchParams
}: {
  searchParams: Promise<{ forwardFrom?: string }>
}) {
  const { forwardFrom } = await searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const users = await getUsers()
  
  let initialData = null
  if (forwardFrom) {
    const doc = await getDocumentDetails(forwardFrom)
    if (doc) {
      let allAttachments = doc.attachments || []
      
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: reports } = await supabaseAdmin
        .from('document_reports')
        .select('attachment_url')
        .eq('document_id', doc.id)
        
      if (reports) {
        reports.forEach(r => {
          if (r.attachment_url) {
            try {
              const attachments = JSON.parse(r.attachment_url)
              if (Array.isArray(attachments)) {
                allAttachments = [...allAttachments, ...attachments]
              }
            } catch (e) {}
          }
        })
      }

      initialData = {
        forwardFromId: doc.id,
        summary: doc.summary,
        content: doc.content,
        type: doc.type,
        priority: doc.priority,
        attachments: allAttachments,
        symbol_number: doc.symbol_number
      }
    }
  }

  return (
    <div className="space-y-6">
      <CreateDocumentForm users={users} currentUserId={user.id} initialData={initialData} />
    </div>
  )
}
