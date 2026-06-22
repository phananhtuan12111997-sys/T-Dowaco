'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
  // Tạo admin client để bypass RLS
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('payslips')
    .insert({
      month: parseInt(monthStr),
      year: parseInt(yearStr),
      net_salary: parseFloat(total_salary_str),
      user_id: user_id || user.id // Mặc định tự gửi cho mình để dễ test
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
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Đánh dấu đã xem bằng cách update notification (chỉ update cho chính user đó)
  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('document_id', payslipId)
    .eq('user_id', user.id)
    
  revalidatePath('/bang-luong')
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
    .select('department, is_admin, full_name, role')
    .eq('id', user.id)
    .single()

  const fullName = profile?.full_name?.toLowerCase() || ''
  const roleName = profile?.role?.toLowerCase() || ''
  const departmentName = profile?.department?.toLowerCase() || ''

  const isChau = fullName.includes('nguyễn thị hồng châu') || fullName.includes('nguyễn thi hồng châu')
  const isTuyet = fullName.includes('lê thị kim tuyết')
  const isChiefAccountant = roleName.includes('kế toán trưởng') || (departmentName.includes('kế toán') && roleName.includes('trưởng'))
  const isAdmin = profile?.is_admin === true
  
  if (!isAdmin && !isChau && !isTuyet && !isChiefAccountant) {
    return { success: false, error: 'Bạn không có quyền thực hiện chức năng này' }
  }

  try {
    // 1. Lấy danh sách profiles để match
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')

    if (profilesError) throw profilesError

    const removeVietnameseTones = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
    }

    const normalize = (str: string) => {
      if (!str) return ''
      return removeVietnameseTones(str.toLowerCase().trim().replace(/\s+/g, ' '))
    }
    const profileMap = new Map()
    profiles?.forEach(p => {
      if (p.full_name) {
        profileMap.set(normalize(p.full_name), p.id)
      }
    })

    const payslipsToInsert: any[] = []
    const notificationsToInsert: any[] = []
    const unmatchedNames: string[] = []

    // 2. Map data
    for (const row of payload.data) {
      const rawName = row[payload.nameField]
      if (!rawName) continue

      const normalizedName = normalize(rawName)
      const userId = profileMap.get(normalizedName)
      
      // Nếu không map được chính xác, tìm kiếm gần đúng (chứa chuỗi)
      let matchedUserId = userId
      if (!matchedUserId) {
        const potentialMatch = profiles?.find(p => p.full_name && (normalize(p.full_name).includes(normalizedName) || normalizedName.includes(normalize(p.full_name))))
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
          net_salary: totalSalary,
          details: row // Toàn bộ dữ liệu của row đó
        })
      } else {
        unmatchedNames.push(rawName)
      }
    }

    if (payslipsToInsert.length === 0) {
      return { success: false, error: 'Không tìm thấy nhân viên nào khớp với file Excel. Bạn có thể kiểm tra lại tên nhân viên.' }
    }

    // Tạo admin client để vượt quyền RLS khi upload hàng loạt
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Xóa dữ liệu cũ nếu trùng tháng/năm
    const { data: existingPayslips } = await supabaseAdmin
      .from('payslips')
      .select('id')
      .eq('month', payload.month)
      .eq('year', payload.year)
      .in('user_id', payslipsToInsert.map(p => p.user_id))
      
    if (existingPayslips && existingPayslips.length > 0) {
      const idsToDelete = existingPayslips.map(p => p.id)
      await supabaseAdmin
        .from('notifications')
        .delete()
        .in('document_id', idsToDelete)
        
      await supabaseAdmin
        .from('payslips')
        .delete()
        .in('id', idsToDelete)
    }

    // 4. Insert dữ liệu mới
    const { data: insertedPayslips, error: insertError } = await supabaseAdmin
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

      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationsToInsert)
        
      if (notifError) console.error('Lỗi khi tạo notification:', notifError)
    }

    revalidatePath('/bang-luong')
    return { success: true, count: payslipsToInsert.length, unmatchedNames }
  } catch (err: any) {
    console.error('Bulk upload error:', err)
    return { success: false, error: err.message || 'Lỗi không xác định' }
  }
}

export async function revokeMonthPayslips(month: number, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Chưa đăng nhập' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('department, is_admin, full_name, role')
    .eq('id', user.id)
    .single()

  const fullName = profile?.full_name?.toLowerCase() || ''
  const roleName = profile?.role?.toLowerCase() || ''
  const departmentName = profile?.department?.toLowerCase() || ''

  const isChau = fullName.includes('nguyễn thị hồng châu') || fullName.includes('nguyễn thi hồng châu')
  const isTuyet = fullName.includes('lê thị kim tuyết')
  const isChiefAccountant = roleName.includes('kế toán trưởng') || (departmentName.includes('kế toán') && roleName.includes('trưởng'))
  const isAdmin = profile?.is_admin === true
  
  if (!isAdmin && !isChau && !isTuyet && !isChiefAccountant) {
    return { success: false, error: 'Bạn không có quyền thực hiện chức năng này' }
  }

  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Lấy danh sách payslip id của tháng/năm này
    const { data: payslips } = await supabaseAdmin
      .from('payslips')
      .select('id')
      .eq('month', month)
      .eq('year', year)

    if (payslips && payslips.length > 0) {
      const payslipIds = payslips.map(p => p.id)

      // Xóa notifications
      await supabaseAdmin
        .from('notifications')
        .delete()
        .in('document_id', payslipIds)

      // Xóa payslips
      await supabaseAdmin
        .from('payslips')
        .delete()
        .eq('month', month)
        .eq('year', year)
    }

    revalidatePath('/bang-luong')
    return { success: true }
  } catch (err: any) {
    console.error('Revoke error:', err)
    return { success: false, error: err.message || 'Lỗi khi thu hồi bảng lương' }
  }
}

