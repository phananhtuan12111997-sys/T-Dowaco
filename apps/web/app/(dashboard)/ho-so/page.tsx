import { createClient } from '@/utils/supabase/server'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { AvatarForm } from './avatar-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cập nhật thông tin</h1>
        <p className="text-slate-500">Quản lý thông tin cá nhân và mật khẩu của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <AvatarForm profile={profile} />
        <ProfileForm profile={profile} />
        <PasswordForm />
      </div>
    </div>
  )
}
