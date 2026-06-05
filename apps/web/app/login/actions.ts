'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  // We append a fake domain to use Supabase's email auth with a custom username
  const email = username.includes('@') ? username : `${username}@t-dowaco.vn`

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Tài khoản hoặc mật khẩu không chính xác.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
