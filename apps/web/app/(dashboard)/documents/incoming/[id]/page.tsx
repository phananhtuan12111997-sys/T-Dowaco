import { notFound } from 'next/navigation'
import { getDocumentDetails, getRecipients, markAsRead } from './actions'
import { getUsers } from '../../create/actions'
import { DocumentDetailsClient } from './document-details-client'
import { createClient } from '@/utils/supabase/server'

export default async function IncomingDocumentDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const documentId = (await params).id
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // 1. Lấy chi tiết văn bản
  const document = await getDocumentDetails(documentId)
  if (!document) {
    notFound()
  }

  // 2. Đánh dấu đã xem (nếu chưa xem)
  await markAsRead(documentId)

  // 3. Lấy danh sách người nhận hiện tại
  const recipients = await getRecipients(documentId)
  
  // 4. Lấy danh sách user (cho mục chuyển tiếp)
  const users = await getUsers()

  return (
    <DocumentDetailsClient 
      document={document} 
      recipients={recipients}
      users={users}
      currentUserId={user.id}
    />
  )
}
