'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const address = formData.get('address') as string
  const gender = formData.get('gender') as string

  const updates = {
    full_name,
    phone,
    email,
    address,
    gender,
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    throw new Error('Cập nhật thông tin thất bại')
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const avatar = formData.get('avatar') as File | null
  if (!avatar || avatar.size === 0) {
    throw new Error('Không có file ảnh được chọn')
  }

  const fileExt = avatar.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, avatar)
  
  if (uploadError) {
    throw new Error('Upload ảnh thất bại: ' + uploadError.message)
  }

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq('id', user.id)

  if (updateError) {
    throw new Error('Lưu đường dẫn ảnh thất bại')
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    throw new Error('Mật khẩu xác nhận không khớp')
  }

  if (password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự')
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    let errorMessage = error.message
    if (errorMessage.includes('different from the old password')) {
      errorMessage = 'Mật khẩu mới phải khác mật khẩu cũ'
    } else if (errorMessage.includes('should be at least')) {
      errorMessage = 'Mật khẩu quá ngắn'
    } else if (errorMessage.includes('same as the old')) {
      errorMessage = 'Mật khẩu mới phải khác mật khẩu cũ'
    }
    throw new Error(errorMessage)
  }

  return { success: true }
}
