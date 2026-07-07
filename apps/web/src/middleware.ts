import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];

function withNoStore(response: NextResponse) {
  // ponytail: 避免 CDN/nginx 缓存带 307 的鉴权响应，线上点项目误跳登录
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!token && !isPublic && pathname !== '/') {
    return withNoStore(NextResponse.redirect(new URL('/login', request.url)));
  }

  if (token && pathname === '/login') {
    return withNoStore(NextResponse.redirect(new URL('/generate', request.url)));
  }

  if (pathname === '/') {
    return withNoStore(
      NextResponse.redirect(new URL(token ? '/generate' : '/login', request.url)),
    );
  }

  return withNoStore(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
