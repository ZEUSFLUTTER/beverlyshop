import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'super-secret-key-inv-boutique-2026'
);

const SESSION_COOKIE = 'inv-session';

const publicPaths = ['/', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get session token
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const role = payload.role as string;

    // Role-based access control
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/commercant', request.url));
    }

    if (pathname.startsWith('/commercant') && role !== 'COMMERCANT') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
