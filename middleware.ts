import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (!user) {
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/label')
    ) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // For routes that need account-type awareness, fetch profile once
  const needsProfile =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/label') ||
    pathname === '/login' ||
    pathname === '/signup'

  if (needsProfile) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete, account_type')
      .eq('id', user.id)
      .single()

    const accountType = profile?.account_type ?? 'artist'
    const onboardingComplete = profile?.onboarding_complete ?? false
    const isLabel = accountType === 'label'

    // Bounce authenticated users away from auth pages
    if (pathname === '/login' || pathname === '/signup') {
      const dest = isLabel && onboardingComplete ? '/label' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // /label/* — label users only
    if (pathname.startsWith('/label')) {
      if (!isLabel) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      if (!onboardingComplete) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      return supabaseResponse
    }

    // /dashboard — non-label users with completed onboarding
    if (pathname.startsWith('/dashboard') && !onboardingComplete) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // /onboarding — redirect away if already complete
    if (pathname.startsWith('/onboarding') && onboardingComplete) {
      const dest = isLabel ? '/label' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/onboarding', '/login', '/signup', '/label/:path*', '/label'],
}
