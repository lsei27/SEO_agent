import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateBasicAuth, createBasicAuthChallenge } from './lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for health check
  if (pathname === '/health') {
    return NextResponse.json({ status: 'ok', timestamp: Date.now() })
  }

  // Apply Basic Auth to all routes
  const authHeader = request.headers.get('authorization')

  if (!validateBasicAuth(authHeader)) {
    return createBasicAuthChallenge()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
