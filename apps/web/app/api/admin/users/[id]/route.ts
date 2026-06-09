import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseServer.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const resolvedParams = await params
    const targetUserId = resolvedParams.id
    if (!targetUserId) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

    const formData = await request.formData()
    const password = formData.get('password') as string | null
    const full_name = formData.get('full_name') as string
    const department = formData.get('department') as string
    const role = formData.get('role') as string
    const phone = formData.get('phone') as string
    const gender = formData.get('gender') as string
    const email = formData.get('email') as string
    const address = formData.get('address') as string
    const avatar = formData.get('avatar') as File | null

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Update Auth (Password if provided)
    if (password && password.trim().length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: password
      })
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    let avatar_url = undefined
    if (avatar && avatar.size > 0) {
      const fileExt = avatar.name.split('.').pop()
      const fileName = `${targetUserId}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabaseAdmin.storage.from('avatars').upload(fileName, avatar)
      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(fileName)
        avatar_url = publicUrlData.publicUrl
      }
    }

    // Update Profile
    const updateData: any = { full_name, department, role, phone, email, address, gender }
    if (avatar_url) updateData.avatar_url = avatar_url
    if (password && password.trim().length > 0) updateData.force_password_change = true

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', targetUserId)

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseServer.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const resolvedParams = await params
    const targetUserId = resolvedParams.id
    if (!targetUserId) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })

    if (targetUserId === user.id) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Delete Auth User
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Profile is usually cascade deleted but we can explicitly delete it too
    await supabaseAdmin.from('profiles').delete().eq('id', targetUserId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
