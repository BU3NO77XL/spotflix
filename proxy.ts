import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// Define the routes that need to be protected
const protectedRoutes = ['/watch', '/my-list'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;
    
    // If no valid session exists, redirect to home page with a flag
    // to trigger the login modal
    if (!session || !session.userId) {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('requireLogin', 'true');
      return NextResponse.redirect(homeUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
