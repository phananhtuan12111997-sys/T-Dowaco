'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createMeeting(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Bạn chưa đăng nhập')
  }

  const { data: profile } = await supabase.from('profiles').select('role, is_admin, department').eq('id', user.id).single()
  
  const isBanDieuHanh = profile?.department === 'Ban điều hành'
  const isToChucHanhChanh = profile?.department === 'Phòng tổ chức Hành chánh'
  const allowedRoles = ['Kế toán trưởng', 'Trưởng phòng', 'Phó phòng', 'Đội trưởng', 'Đội phó', 'Quản đốc', 'Phó quản đốc']
  const hasAllowedRole = allowedRoles.includes(profile?.role || '')
  
  if (!profile || (!profile.is_admin && !isBanDieuHanh && !isToChucHanhChanh && !hasAllowedRole)) {
    throw new Error('Bạn không có quyền đăng ký lịch họp')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const room = formData.get('room') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  let departments = formData.getAll('departments') as string[]
  const host = formData.get('host') as string
  
  const isFullAccess = profile?.is_admin || isBanDieuHanh || isToChucHanhChanh;
  if (!isFullAccess) {
    departments = [profile.department];
  }

  if (!title || !start_time || !end_time || !room || !host) {
    throw new Error('Vui lòng nhập đầy đủ các trường bắt buộc')
  }

  const { data: insertedMeeting, error } = await supabase
    .from('meetings')
    .insert({
      title,
      description,
      host,
      room,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      status: 'Đã duyệt',
      created_by: user.id
    })
    .select('id')
    .single()

  if (error || !insertedMeeting) {
    console.error('Error creating meeting:', error)
    throw new Error(`Có lỗi: ${error?.message || JSON.stringify(error)}`)
  }

  // Gửi thông báo
  if (departments.length > 0) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let query = supabaseAdmin.from('profiles').select('id').neq('id', user.id) // Loại trừ người tạo
    if (!departments.includes('Tất cả')) {
      query = query.in('department', departments)
    }

    const { data: usersToNotify } = await query

    if (usersToNotify && usersToNotify.length > 0) {
      const notificationsData = usersToNotify.map((u) => ({
        user_id: u.id,
        message: `Lịch họp mới: ${title}`,
        is_read: false,
        document_id: insertedMeeting.id
      }))

      await supabaseAdmin.from('notifications').insert(notificationsData)
    }
  }

  revalidatePath('/meetings')
  redirect('/meetings?success=1')
}

export async function updateMeeting(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn chưa đăng nhập')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const room = formData.get('room') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const host = formData.get('host') as string

  if (!title || !start_time || !end_time || !room || !host) {
    throw new Error('Vui lòng nhập đầy đủ các trường bắt buộc')
  }

  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin

  let error;
  if (isITAdmin) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const res = await supabaseAdmin
      .from('meetings')
      .update({
        title,
        description,
        host,
        room,
        start_time: new Date(start_time).toISOString(),
        end_time: new Date(end_time).toISOString()
      })
      .eq('id', id)
    error = res.error
  } else {
    const res = await supabase
      .from('meetings')
      .update({
        title,
        description,
        host,
        room,
        start_time: new Date(start_time).toISOString(),
        end_time: new Date(end_time).toISOString()
      })
      .eq('id', id)
      .eq('created_by', user.id) // Only creator can edit
    error = res.error
  }

  if (error) {
    console.error('Error updating meeting:', error)
    throw new Error(`Có lỗi khi cập nhật: ${error.message || JSON.stringify(error)}`)
  }

  revalidatePath('/meetings')
  redirect('/meetings?success=updated')
}

export async function deleteMeeting(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn chưa đăng nhập')

  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin

  let error;
  if (isITAdmin) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const res = await supabaseAdmin.from('meetings').delete().eq('id', id)
    error = res.error
  } else {
    const res = await supabase.from('meetings').delete().eq('id', id).eq('created_by', user.id)
    error = res.error
  }

  if (error) {
    console.error('Error deleting meeting:', error)
    throw new Error(`Có lỗi khi xóa: ${error.message || JSON.stringify(error)}`)
  }

  revalidatePath('/meetings')
}

