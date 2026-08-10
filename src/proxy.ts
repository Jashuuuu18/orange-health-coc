import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'

// Lightweight gate: only checks that a session cookie is present, so public
// pages don't redirect-flicker for logged-in users. Full verification
// (signature + role) happens per-route via requireAdmin()/requireEmployee()
// in each protected layout, since that's the boundary Next.js guarantees is
// actually enforced for every request (see proxy.js docs on Server Functions).
const PROTECTED_PREFIXES = ['/admin', '/employee', '/code-of-conduct']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const hasSession = request.cookies.has(SESSION_COOKIE_NAME)
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/code-of-conduct/:path*'],
}
