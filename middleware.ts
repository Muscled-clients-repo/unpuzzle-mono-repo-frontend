import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Route to instructor app
  if (pathname.startsWith('/instructor')) {
    // Rewrite to instructor app directory
    url.pathname = `/apps/instructor${pathname.slice(11)}`; // Remove '/instructor' prefix
    return NextResponse.rewrite(url);
  }

  // Route to student app (default)
  if (!pathname.startsWith('/apps/')) {
    url.pathname = `/apps/students${pathname}`;
    return NextResponse.rewrite(url);
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
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};