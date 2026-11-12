import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const reactSessionCookieName = `appwrite-session-${projectId}`;
const sessionCookieName = `a_session_${projectId}`;
const legacyCookieName = `a_session_${projectId}_legacy`;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const allCookies = request.cookies.getAll();
  const hasSession = allCookies.some(
    (c) =>
      c.name === reactSessionCookieName ||
      c.name === sessionCookieName ||
      c.name === legacyCookieName ||
      c.name.startsWith('appwrite-session') ||
      c.name.startsWith('a_session_'),
  );

  const isAuthRoute =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/cadastro' ||
    pathname.startsWith('/cadastro/') ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/') ||
    pathname === '/esqueci-senha' ||
    pathname.startsWith('/esqueci-senha/');

  const isAppRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/tables') ||
    pathname.startsWith('/menu') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/kds') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/settings');

  // If logged in user tries to access auth pages -> redirect to app
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If unauthenticated user tries to access protected app pages -> redirect to login
  if (isAppRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)'],
};
