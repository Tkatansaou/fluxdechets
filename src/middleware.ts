import { NextRequest, NextResponse } from 'next/server'

const COOKIE_PREFIX = process.env.NEXT_PUBLIC_COOKIE_PREFIX ?? 'wf'
const ACCESS_COOKIE = `${COOKIE_PREFIX}-access`

const PUBLIC_EXACT = new Set(['/login', '/signup', '/', '/forgot-password', '/reset-password'])
const PUBLIC_PREFIXES = [
  '/pay/',
  '/api/',
  '/api-docs',
  '/_next/',
  '/favicon',
  '/icon',
  '/opengraph-image',
  '/sitemap',
  '/robots',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic =
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p))

  if (!isPublic && !req.cookies.get(ACCESS_COOKIE)) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
