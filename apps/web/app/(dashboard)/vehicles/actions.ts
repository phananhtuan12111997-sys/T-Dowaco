'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
  const approver_id = formData.get('approver_id') as string
  const companions = formData.getAll('companions') // Gets all selected checkboxes

  // Validate basic
  if (!requester_name || !trip_purpose || !start_time || !end_time) {
    throw new Error('Vui lòng nhập đầy đủ Tên, Thông tin chuyến đi, Thời gian đi và Thời gian về')
  }

  // Ghi vào CSDL
  const { data, error } = await supabase
    .from('vehicle_requests')
    .insert({
      requester_name,
      trip_purpose,
      destination: trip_purpose,
      start_time: new Date(start_time).toISOString(),
      departure_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      vehicle_info,
      status: 'Chờ duyệt',
      created_by: user.id,
      approver_id: approver_id || null,
      companion_count: companions ? companions.length : 0,
      companions: companions.length > 0 ? companions : null
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Error creating vehicle request:', error)
    throw new Error(`Lỗi CSDL: ${error?.message || 'Không xác định'}`)
  }

  // Gửi thông báo
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const notificationsToInsert = []

  if (approver_id) {
    notificationsToInsert.push({
      user_id: approver_id,
      document_id: data.id,
      message: `${requester_name} vừa gửi một đơn xin xe mới cần bạn duyệt.`,
      is_read: false
    })
  }

  if (companions && companions.length > 0) {
    companions.forEach((compId: string) => {
      notificationsToInsert.push({
        user_id: compId,
        document_id: data.id,
        message: `${requester_name} vừa thêm bạn vào một chuyến đi xe mới.`,
        is_read: false
      })
    })
  }

  if (notificationsToInsert.length > 0) {
    await supabaseAdmin.from('notifications').insert(notificationsToInsert)
  }

  // Refresh lại danh sách và chuyển hướng
  revalidatePath('/vehicles')

  // Redirect with success flag
  redirect('/vehicles?success=true')
}

export async function updateVehicleRequestStatus(id: string, status: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Bạn chưa đăng nhập')
  }

  const { error } = await supabase
    .from('vehicle_requests')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Error updating vehicle request:', error)
    throw new Error('Có lỗi xảy ra khi cập nhật trạng thái')
  }

  const { data: reqData } = await supabase.from('vehicle_requests').select('created_by, companions, trip_purpose').eq('id', id).single()

  if (reqData) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const notificationsToInsert = []

    const msg = `Đơn xin xe đi "${reqData.trip_purpose}" đã được ${status.toLowerCase()}`
    notificationsToInsert.push({
      user_id: reqData.created_by,
      document_id: id,
      message: msg,
      is_read: false
    })

    if (reqData.companions) {
      let companionsList = []
      try {
        companionsList = typeof reqData.companions === 'string' ? JSON.parse(reqData.companions) : reqData.companions
      } catch (e) {
        companionsList = []
      }
      
      if (Array.isArray(companionsList)) {
        companionsList.forEach((compId: string) => {
          notificationsToInsert.push({
            user_id: compId,
            document_id: id,
            message: `Đơn xin xe đi "${reqData.trip_purpose}" mà bạn tham gia đã được ${status.toLowerCase()}`,
            is_read: false
          })
        })
      }
    }

    if (notificationsToInsert.length > 0) {
      await supabaseAdmin.from('notifications').insert(notificationsToInsert)
    }
  }

  revalidatePath('/vehicles')
}

export async function deleteVehicleRequest(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn chưa đăng nhập')

  const { data: profile } = await supabase.from('profiles').select('department, is_admin').eq('id', user.id).single()
  const isITAdmin = profile?.department === 'Phòng IT' || profile?.is_admin

  let query = supabase.from('vehicle_requests').delete().eq('id', id)
  if (!isITAdmin) {
    query = query.eq('created_by', user.id)
  }

  const { error } = await query

  if (error) {
    throw new Error('Lỗi khi xóa đơn: ' + error.message)
  }

  revalidatePath('/vehicles')
}

export async function updateVehicleRequest(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn chưa đăng nhập')

  const requester_name = formData.get('requester_name') as string
  const trip_purpose = formData.get('trip_purpose') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const vehicle_info = formData.get('vehicle_info') as string
  const approver_id = formData.get('approver_id') as string
  const companions = formData.getAll('companions')

  if (!requester_name || !trip_purpose || !start_time || !end_time) {
    throw new Error('Vui lòng nhập đầy đủ Tên, Thông tin chuyến đi, Thời gian đi và Thời gian về')
  }

  const { error } = await supabase
    .from('vehicle_requests')
    .update({
      requester_name,
      trip_purpose,
      destination: trip_purpose,
      start_time: new Date(start_time).toISOString(),
      departure_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      vehicle_info,
      approver_id: approver_id || null,
      companion_count: companions ? companions.length : 0,
      companions: companions.length > 0 ? companions : null
    })
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) {
    throw new Error(`Lỗi cập nhật CSDL: ${error.message}`)
  }

  revalidatePath('/vehicles')
  redirect('/vehicles?success=edit')
}
