'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { RecipientListModal } from '@/app/(dashboard)/documents/sent/recipient-list-modal'
import { StatusDetailsModal } from '@/app/(dashboard)/documents/sent/status-details-modal'
import { SentDocumentActions } from '@/app/(dashboard)/documents/sent/sent-document-actions'

export function SentDocumentRow({ doc, currentUserId, isITAdmin }: { doc: any, currentUserId?: string, isITAdmin?: boolean }) {
  const router = useRouter()

  const handleRowClick = (e: React.MouseEvent) => {
    // Only navigate if we didn't click on a button, link, or their children
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('.no-row-click')) {
      return
    }
    router.push(`/documents/sent/${doc.id}?from=sent`)
  }

  return (
    <tr 
      onClick={handleRowClick}
      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <td className="px-6 py-4 text-center">
        {doc.priority ? (
          <span className="text-amber-600 font-medium whitespace-nowrap">Quan trọng</span>
        ) : (
          <span className="text-slate-600 whitespace-nowrap">Bình thường</span>
        )}
      </td>
      <td className="px-6 py-4 font-medium text-slate-900 text-center">{doc.symbol_number}</td>
      <td className="px-6 py-4 text-slate-600 max-w-md truncate text-center" title={doc.summary}>
        {doc.summary}
      </td>
      <td className="px-6 py-4 text-center">
        <Badge variant="outline" className="bg-cyan-50 text-cyan-600 border-cyan-200 font-normal whitespace-nowrap">
          {doc.type}
        </Badge>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="no-row-click">
          <RecipientListModal count={doc.recipient_count} recipients={doc.document_recipients} />
        </div>
      </td>
      <td className="px-6 py-4 text-slate-500 text-center">
        {new Date(doc.created_at).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="no-row-click">
          <StatusDetailsModal readCount={doc.read_count} totalCount={doc.recipient_count} recipients={doc.document_recipients} documentId={doc.id} />
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="no-row-click">
          <SentDocumentActions documentId={doc.id} documentName={doc.symbol_number || doc.summary || 'Công văn không tên'} createdBy={doc.created_by} currentUserId={currentUserId} isITAdmin={isITAdmin} />
        </div>
      </td>
    </tr>
  )
}
