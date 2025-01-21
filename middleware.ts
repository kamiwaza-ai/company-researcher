import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookie } from '@/lib/auth/cookies';
import { verifyKamiwazaToken } from '@/lib/auth/kamiwaza';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === '/login') {
    const token = await getAuthCookie();
    if (token) {
      try {
        await verifyKamiwazaToken(token);
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
        // Token is invalid, continue to login page
      }
    }
    return NextResponse.next();
  }

  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await verifyKamiwazaToken(token);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
};
