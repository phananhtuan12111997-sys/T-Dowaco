import { notFound } from 'next/navigation'
import { getDocumentDetails, getRecipients } from '../../incoming/[id]/actions'
import { SentDocumentDetailsClient } from './sent-document-details-client'

export default async function SentDocumentDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const documentId = (await params).id
  
  const document = await getDocumentDetails(documentId)
  if (!document) {
    notFound()
  }

  const recipients = await getRecipients(documentId)
  
  return (
    <SentDocumentDetailsClient 
      document={document} 
      recipients={recipients}
    />
  )
}
