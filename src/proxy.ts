import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🔍 MIDDLEWARE:', {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    cookies: request.cookies.getAll(),
  })

  // Log auth-related requests
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    console.log('🔍 AUTH REQUEST:', {
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname,
      searchParams: request.nextUrl.searchParams.toString(),
      headers: Object.fromEntries(request.headers.entries()),
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/login',
    '/dashboard'
  ]
}
