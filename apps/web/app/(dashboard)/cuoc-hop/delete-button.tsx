'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFormStatus } from 'react-dom'

export function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      type="submit" 
      disabled={pending}
      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
      onClick={(e) => {
        if (!confirm('Bạn có chắc chắn muốn xóa cuộc họp này?')) e.preventDefault()
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
