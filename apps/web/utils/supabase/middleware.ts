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

    // Prevent access to /hr if not admin or HR
    if (path.startsWith('/hr') && !canManageHR) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Prevent access to /news/create if not admin or HR
    if (path.startsWith('/news/create') && !canPostNews) {
      const url = request.nextUrl.clone()
      url.pathname = '/news'
      return NextResponse.redirect(url)
    }

    // Prevent access to /payslips/create if not admin or Accountant
    if (path.startsWith('/payslips/create') && !canCreatePayslip) {
      const url = request.nextUrl.clone()
      url.pathname = '/payslips'
      return NextResponse.redirect(url)
    }

    // Prevent access to /meetings/create and /meetings/edit if not allowed
    if ((path.startsWith('/meetings/create') || path.startsWith('/meetings/edit')) && !canManageMeetings) {
      const url = request.nextUrl.clone()
      url.pathname = '/meetings'
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
