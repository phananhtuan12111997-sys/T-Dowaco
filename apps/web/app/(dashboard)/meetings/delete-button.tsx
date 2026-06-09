'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DeleteButton() {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      type="submit" 
      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
      onClick={(e) => {
        if (!confirm('Bạn có chắc chắn muốn xóa cuộc họp này?')) e.preventDefault()
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
