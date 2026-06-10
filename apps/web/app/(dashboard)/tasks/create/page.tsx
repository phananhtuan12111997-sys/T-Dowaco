import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTaskForm } from './create-task-form'
import { getUsers } from '../actions'

export default async function CreateTaskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch current user profile to get role and department
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role, department, is_admin')
    .eq('id', user.id)
    .single()

  const role = currentUserProfile?.role?.trim() || ''
  const department = currentUserProfile?.department?.trim() || ''
  const isAdmin = currentUserProfile?.is_admin || department === 'Phòng IT'

  if ((role.toLowerCase() === 'nhân viên' || !role) && !isAdmin) {
    redirect('/tasks/incoming')
  }

  const allUsers = await getUsers()
  
  let filteredUsers = allUsers

  const roleLower = role.toLowerCase()
  
  if (isAdmin) {
    // Admin thấy tất cả trừ Giám đốc và Phó giám đốc
    filteredUsers = allUsers.filter(u => u.role?.toLowerCase() !== 'giám đốc' && u.role?.toLowerCase() !== 'phó giám đốc')
  } else if (roleLower === 'giám đốc') {
    // Thấy tất cả
    filteredUsers = allUsers
  } else if (roleLower === 'phó giám đốc') {
    // Thấy tất cả trừ Giám đốc
    filteredUsers = allUsers.filter(u => u.role?.toLowerCase() !== 'giám đốc')
  } else if (
    roleLower === 'trưởng phòng' || 
    roleLower === 'kế toán trưởng' || 
    roleLower === 'đội trưởng' || 
    roleLower === 'quản đốc'
  ) {
    // Thấy tất cả user cùng phòng ban
    filteredUsers = allUsers.filter(u => u.department === department)
  } else if (roleLower === 'phó phòng') {
    // Thấy tất cả user cùng phòng ban trừ Trưởng phòng
    filteredUsers = allUsers.filter(u => u.department === department && u.role?.toLowerCase() !== 'trưởng phòng')
  } else if (roleLower === 'đội phó') {
    // Thấy tất cả user cùng phòng ban trừ Đội trưởng
    filteredUsers = allUsers.filter(u => u.department === department && u.role?.toLowerCase() !== 'đội trưởng')
  } else if (roleLower === 'phó quản đốc') {
    // Thấy tất cả user cùng phòng ban trừ Quản đốc
    filteredUsers = allUsers.filter(u => u.department === department && u.role?.toLowerCase() !== 'quản đốc')
  } else {
    // Fallback: Default to department only if it's some other manager role
    filteredUsers = allUsers.filter(u => u.department === department)
  }

  return (
    <div className="space-y-6">
      <CreateTaskForm users={filteredUsers} currentUserId={user.id} />
    </div>
  )
}
