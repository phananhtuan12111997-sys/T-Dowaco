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
          cookiesToSet.forEach(({ name, value, options }) => {
            const sessionOptions = { ...options }
            delete sessionOptions.maxAge
            delete sessionOptions.expires
            supabaseResponse.cookies.set(name, value, sessionOptions)
          })
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
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Optimize: Only fetch profile for page navigations (GET requests)
    // Avoid fetching for POST/PUT/DELETE (Server Actions/APIs) to save DB load
    if (request.method !== 'GET') {
      return supabaseResponse;
    }

    // Fetch user profile to check force_password_change and is_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('force_password_change, is_admin, department, role')
      .eq('id', user.id)
      .single()

    const forcePasswordChange = profile?.force_password_change

    // Redirect to force-change-password if needed
    if (forcePasswordChange && path !== '/force-change-password') {
      const url = request.nextUrl.clone()
      url.pathname = '/force-change-password'
      return NextResponse.redirect(url)
    }

    const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch')
    const isAccountant = profile?.department?.toLowerCase().includes('kế toán')
    const isAdmin = profile?.is_admin === true
    const canManageHR = isAdmin || isHR
    const canPostNews = isAdmin || isHR
    const canCreatePayslip = isAdmin || isAccountant

    const isBanDieuHanh = profile?.department === 'Ban điều hành'
    const isToChucHanhChanh = profile?.department === 'Phòng tổ chức Hành chánh'
    const allowedMeetingRoles = ['Kế toán trưởng', 'Trưởng phòng', 'Phó phòng', 'Đội trưởng', 'Đội phó', 'Quản đốc', 'Phó quản đốc']
    const hasAllowedMeetingRole = allowedMeetingRoles.includes(profile?.role || '')
    const canManageMeetings = isAdmin || isBanDieuHanh || isToChucHanhChanh || hasAllowedMeetingRole

    // Prevent access to /nhan-su if not admin or HR
    if (path.startsWith('/nhan-su') && !canManageHR) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Prevent access to /bang-tin/create if not admin or HR
    if (path.startsWith('/bang-tin/create') && !canPostNews) {
      const url = request.nextUrl.clone()
      url.pathname = '/bang-tin'
      return NextResponse.redirect(url)
    }

    // Prevent access to /bang-luong/create if not admin or Accountant
    if (path.startsWith('/bang-luong/create') && !canCreatePayslip) {
      const url = request.nextUrl.clone()
      url.pathname = '/bang-luong'
      return NextResponse.redirect(url)
    }

    // Prevent access to /cuoc-hop/create and /cuoc-hop/edit if not allowed
    if ((path.startsWith('/cuoc-hop/create') || path.startsWith('/cuoc-hop/edit')) && !canManageMeetings) {
      const url = request.nextUrl.clone()
      url.pathname = '/cuoc-hop'
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
