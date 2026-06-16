'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPayslip(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Bạn chưa đăng nhập')
  }

  // Lấy dữ liệu từ form
  const title = formData.get('title') as string
  const monthStr = formData.get('month') as string
  const yearStr = formData.get('year') as string
  const total_salary_str = formData.get('total_salary') as string
  const user_id = formData.get('user_id') as string // ID của nhân viên nhận lương
  
  // Xử lý logic file đính kèm đơn giản (Mock)
  // Trong thực tế sẽ dùng supabase.storage để upload file thật
  const has_file = formData.get('has_file') === 'on'
  const attachment_url = has_file ? 'mock_excel_file_url.xlsx' : null

  // Validate basic
  if (!title || !monthStr || !yearStr || !total_salary_str) {
    throw new Error('Vui lòng nhập đầy đủ các trường bắt buộc')
  }

  // Ghi vào CSDL
  const { error } = await supabase
    .from('payslips')
    .insert({
      title,
      month: parseInt(monthStr),
      year: parseInt(yearStr),
      total_salary: parseFloat(total_salary_str),
      attachment_url,
      user_id: user_id || user.id, // Mặc định tự gửi cho mình để dễ test
      status: 'Chưa xem'
    })

  if (error) {
    console.error('Error creating payslip:', error)
    throw new Error('Có lỗi xảy ra khi tạo phiếu lương')
  }

  // Refresh lại danh sách và chuyển hướng
  revalidatePath('/bang-luong')
  redirect('/bang-luong')
}

export async function markAsRead(payslipId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('payslips')
    .update({ status: 'Đã xem' })
    .eq('id', payslipId)
    
  if (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error)
  }
  
  redirect(`/bang-luong/${payslipId}`)
}

export async function uploadBulkPayslips(payload: {
  month: number
  year: number
  data: Record<string, any>[]
  nameField: string
  totalField: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Chưa đăng nhập' }
  }

  // Lấy thông tin user hiện tại để kiểm tra quyền
  const { data: profile } = await supabase
    .from('profiles')
    .select('department, is_admin')
    .eq('id', user.id)
    .single()

  const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch')
  const isAccountant = profile?.department?.toLowerCase().includes('kế toán')
  const isAdmin = profile?.is_admin === true
  
  if (!isAdmin && !isHR && !isAccountant) {
    return { success: false, error: 'Bạn không có quyền thực hiện chức năng này' }
  }

  try {
    // 1. Lấy danh sách profiles để match
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')

    if (profilesError) throw profilesError

    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ')
    const profileMap = new Map()
    profiles?.forEach(p => {
      if (p.full_name) {
        profileMap.set(normalize(p.full_name), p.id)
      }
    })

    const payslipsToInsert = []
    const notificationsToInsert = []

    // 2. Map data
    for (const row of payload.data) {
      const rawName = row[payload.nameField]
      if (!rawName) continue

      const normalizedName = normalize(rawName)
      const userId = profileMap.get(normalizedName)
      
      // Nếu không map được chính xác, tìm kiếm gần đúng (chứa chuỗi)
      let matchedUserId = userId
      if (!matchedUserId) {
        const potentialMatch = profiles?.find(p => p.full_name && normalize(p.full_name).includes(normalizedName) || normalizedName.includes(normalize(p.full_name || '')))
        if (potentialMatch) {
          matchedUserId = potentialMatch.id
        }
      }

      if (matchedUserId) {
        const rawTotal = row[payload.totalField]
        // Parse string to number if needed ("20,000,000" -> 20000000)
        let totalSalary = 0
        if (typeof rawTotal === 'number') {
          totalSalary = rawTotal
        } else if (typeof rawTotal === 'string') {
          totalSalary = parseFloat(rawTotal.replace(/[^0-9.-]+/g,""))
        }

        payslipsToInsert.push({
          user_id: matchedUserId,
          month: payload.month,
          year: payload.year,
          title: `Phiếu lương tháng ${payload.month}/${payload.year}`,
          total_salary: totalSalary,
          details: row, // Toàn bộ dữ liệu của row đó
          status: 'Chưa xem'
        })
      }
    }

    if (payslipsToInsert.length === 0) {
      return { success: false, error: 'Không tìm thấy nhân viên nào khớp với file Excel.' }
    }

    // 3. Xoá các phiếu lương cũ của tháng/năm này nếu upload đè (Tuỳ chọn: ở đây ta cho phép xoá cũ tạo mới)
    const matchedUserIds = payslipsToInsert.map(p => p.user_id)
    await supabase
      .from('payslips')
      .delete()
      .in('user_id', matchedUserIds)
      .eq('month', payload.month)
      .eq('year', payload.year)

    // 4. Insert Payslips
    const { data: insertedPayslips, error: insertError } = await supabase
      .from('payslips')
      .insert(payslipsToInsert)
      .select('id, user_id, month, year')

    if (insertError) throw insertError

    // 5. Tạo Notifications
    if (insertedPayslips && insertedPayslips.length > 0) {
      insertedPayslips.forEach(slip => {
        notificationsToInsert.push({
          user_id: slip.user_id,
          message: `Bạn có 1 phiếu lương mới tháng ${slip.month}/${slip.year}. Bấm vào để xem chi tiết.`,
          document_id: slip.id, // Dùng tạm document_id để lưu payslip_id dẫn tới chi tiết
          is_read: false
        })
      })

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notificationsToInsert)
        
      if (notifError) console.error('Lỗi khi tạo notification:', notifError)
    }

    revalidatePath('/bang-luong')
    return { success: true, count: payslipsToInsert.length }
  } catch (err: any) {
    console.error('Bulk upload error:', err)
    return { success: false, error: err.message || 'Lỗi không xác định' }
  }
}
