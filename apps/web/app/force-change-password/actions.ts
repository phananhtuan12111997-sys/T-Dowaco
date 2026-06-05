'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function changePassword(formData: FormData) {
  const supabase = await createClient()
  
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Mật khẩu xác nhận không khớp.' }
  }

  if (password.length < 6) {
    return { error: 'Mật khẩu phải có ít nhất 6 ký tự.' }
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Không thể xác thực người dùng.' }
  }

  // 1. Update password in auth.users
  const { error: updateAuthError } = await supabase.auth.updateUser({
    password: password
  })

  if (updateAuthError) {
    return { error: 'Lỗi khi cập nhật mật khẩu.' }
  }

  // 2. Update force_password_change flag in profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ force_password_change: false })
    .eq('id', user.id)

  if (profileError) {
    // Note: if this fails, the user will still be asked to change password next time.
    // In production, we'd want more robust handling, but this is a good start.
    console.error('Failed to update profile flag', profileError)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
