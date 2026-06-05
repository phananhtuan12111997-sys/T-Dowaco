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
      status: 'Chưa xem',
      created_by: user.id
    })

  if (error) {
    console.error('Error creating payslip:', error)
    throw new Error('Có lỗi xảy ra khi tạo phiếu lương')
  }

  // Refresh lại danh sách và chuyển hướng
  revalidatePath('/payslips')
  redirect('/payslips')
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
  
  revalidatePath('/payslips')
}
