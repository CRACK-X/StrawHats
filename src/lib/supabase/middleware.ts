import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup', '/otp-verify', '/forgot-password', '/reset-password', '/waiting-approval', '/privacy', '/terms', '/about', '/events', '/competitions', '/team', '/announcements', '/banned', '/sitemap.xml', '/robots.txt', '/favicon.svg', '/favicon.ico', '/site.webmanifest', '/'];
const AUTH_PAGES = ['/login', '/signup'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && url !== 'your_supabase_url' && url.startsWith('http'));
}

export async function updateSession(request: NextRequest) {
  // Skip middleware for static assets and Next.js internals
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/models') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  // Fast path: skip Supabase entirely for purely public routes
  // (auth pages still need getUser to redirect logged-in users away)
  if (isPublic(pathname) && !AUTH_PAGES.includes(pathname)) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users away from login/signup
  if (user && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Require session for protected routes
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check if user is banned from site
  if (user && !pathname.startsWith('/api/') && pathname !== '/banned') {
    const { data: ban } = await supabase
      .from('user_bans')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'site_ban')
      .eq('active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .maybeSingle();

    if (ban) {
      const url = request.nextUrl.clone();
      url.pathname = '/banned';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
