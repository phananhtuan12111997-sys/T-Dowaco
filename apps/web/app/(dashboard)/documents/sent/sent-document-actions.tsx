'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteDocument } from '@/app/actions/documents'

interface SentDocumentActionsProps {
  documentId: string
  documentName: string
  createdBy?: string
  currentUserId?: string
  isITAdmin?: boolean
}

export function SentDocumentActions({ documentId, documentName, createdBy, currentUserId, isITAdmin }: SentDocumentActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteDocument(documentId)
    setIsDeleting(false)

    if (result.error) {
      alert("Không thể xoá công văn: " + result.error)
    } else {
      // alert("Đã xoá công văn thành công.")
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* View Button */}
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" asChild title="Xem chi tiết">
        <Link href={`/documents/sent/${documentId}`}>
          <Search className="h-4 w-4" />
        </Link>
      </Button>

      {/* Edit Button */}
      {createdBy === currentUserId && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50" 
          title="Chỉnh sửa"
          onClick={(e) => {
            if (!window.confirm(`Bạn có chắc chắn muốn sửa công văn "${documentName}"? Việc sửa đổi sẽ được lưu lại.`)) {
              e.preventDefault();
            }
          }}
          asChild
        >
          <Link href={`/documents/${documentId}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      )}

      {/* Delete Button */}
      {(createdBy === currentUserId || isITAdmin) && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" 
          title="Xoá"
          disabled={isDeleting}
          onClick={() => {
            if (window.confirm(`Bạn có chắc chắn muốn xoá công văn "${documentName}" khỏi hệ thống vĩnh viễn? Những người đã xem công văn sẽ nhận được thông báo công văn bị xoá.`)) {
              handleDelete()
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
