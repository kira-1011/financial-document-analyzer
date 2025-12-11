import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // Optimistic redirect - cookie-based check (fast)
  // Full session validation happens in page/layout components
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/documents/:path*', '/search/:path*', '/settings/:path*', '/support/:path*'],
};
