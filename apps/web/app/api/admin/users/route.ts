import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string
    const department = formData.get('department') as string
    const role = formData.get('role') as string
    const phone = formData.get('phone') as string
    const gender = formData.get('gender') as string
    const email = formData.get('email') as string
    const address = formData.get('address') as string
    const avatar = formData.get('avatar') as File | null

    // Validate required fields
    if (!username || !password || !full_name || !department || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create admin client to bypass RLS and use auth admin API
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // The user's "username" is used as the prefix for a fake email if they don't provide a real one.
    // However, the user request says they can input email as an optional personal info.
    // Supabase auth requires an email. We'll use the provided email, or a fake one.
    const authEmail = username.includes('@') ? username : `${username}@t-dowaco.vn`

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
    }

    let avatar_url = null
    if (avatar && avatar.size > 0) {
      const fileExt = avatar.name.split('.').pop()
      const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(fileName, avatar)
      
      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('avatars')
          .getPublicUrl(fileName)
        avatar_url = publicUrlData.publicUrl
      }
    }

    // Insert into profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        full_name,
        department,
        role,
        phone,
        email,
        address,
        gender,
        avatar_url,
        is_admin: false,
        force_password_change: true // Force password change on first login
      })

    if (profileError) {
      // If profile creation fails, we should ideally delete the auth user to rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: authData.user })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
