'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createVehicleRequest(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Bạn chưa đăng nhập')
  }

  // Lấy dữ liệu từ form
  const requester_name = formData.get('requester_name') as string
  const trip_purpose = formData.get('trip_purpose') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const vehicle_info = formData.get('vehicle_info') as string
  const status = formData.get('status') as string

  // Validate basic
  if (!requester_name || !trip_purpose || !start_time) {
    throw new Error('Vui lòng nhập đầy đủ Tên, Thông tin chuyến đi và Thời gian bắt đầu')
  }

  // Ghi vào CSDL
  const { error } = await supabase
    .from('vehicle_requests')
    .insert({
      requester_name,
      trip_purpose,
      start_time: new Date(start_time).toISOString(),
      end_time: end_time ? new Date(end_time).toISOString() : null,
      vehicle_info,
      status: status || 'Chờ duyệt',
      created_by: user.id
    })

  if (error) {
    console.error('Error creating vehicle request:', error)
    throw new Error('Có lỗi xảy ra khi tạo đơn đăng ký xe')
  }

  // Refresh lại danh sách và chuyển hướng
  revalidatePath('/vehicles')
  redirect('/vehicles')
}
