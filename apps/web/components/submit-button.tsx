'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { ReactNode } from 'react'

interface SubmitButtonProps extends ButtonProps {
  children: ReactNode
  loadingText?: string
  icon?: ReactNode
}

export function SubmitButton({ children, loadingText = 'Đang xử lý...', icon, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || props.disabled} className={className} {...props}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon ? <span className="mr-2">{icon}</span> : null}
      {pending ? loadingText : children}
    </Button>
  )
}
