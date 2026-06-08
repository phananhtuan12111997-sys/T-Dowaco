import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreateDocumentForm } from './create-document-form'
import { getUsers } from './actions'

export default async function CreateDocumentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const users = await getUsers()

  return (
    <div className="space-y-6">
      <CreateDocumentForm users={users} />
    </div>
  )
}
