import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  let isAuthenticated = false;
  try {
    // getUser() validates JWT server-side; getSession() does NOT — use getUser() for security
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();
    // If Supabase is unreachable, fail open (don't redirect to /login in an infinite loop)
    isAuthenticated = !getUserError && !!user;
  } catch {
    // Fail open on unexpected SDK errors to avoid crashing the middleware
    isAuthenticated = false;
  }

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const eventDatetime = process.env.NEXT_PUBLIC_EVENT_DATETIME;
  const isPrelaunch = eventDatetime
    ? Date.now() < new Date(eventDatetime).getTime()
    : false;

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL(isPrelaunch ? '/prelaunch' : '/', request.url));
  }

  if (isAuthenticated && pathname === '/prelaunch' && !isPrelaunch) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
