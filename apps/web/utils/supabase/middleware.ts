import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public paths that do not require auth
  const isPublicPath = path === '/login'

  if (!user && !isPublicPath) {
    // If no user and trying to access private route, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Fetch user profile to check force_password_change and is_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('force_password_change, is_admin')
      .eq('id', user.id)
      .single()

    const forcePasswordChange = profile?.force_password_change

    // Redirect to force-change-password if needed
    if (forcePasswordChange && path !== '/force-change-password') {
      const url = request.nextUrl.clone()
      url.pathname = '/force-change-password'
      return NextResponse.redirect(url)
    }

    // Prevent access to /hr if not admin
    if (path.startsWith('/hr') && profile?.is_admin !== true) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // If user is logged in, restrict access to login page
    if (isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
