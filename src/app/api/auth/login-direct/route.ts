export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/server/prisma'
import { setAuthCookiesOnResponse } from '@/lib/server/auth'
import { logger } from '@/lib/server/logger'

/**
 * GET /api/auth/login-direct?email=katantchaa@gmail.com&password=Admin123!
 *
 * One-time helper : connecte directement sans JavaScript navigateur.
 * À SUPPRIMER APRÈS UTILISATION.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const email = req.nextUrl.searchParams.get('email') ?? ''
  const password = req.nextUrl.searchParams.get('password') ?? ''

  if (email !== 'katantchaa@gmail.com' || password !== 'Admin123!') {
    return NextResponse.redirect(new URL('/login?error=1', req.url))
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, status: true, tokenVersion: true, name: true, role: true },
  })

  if (!user || !user.passwordHash) {
    return NextResponse.redirect(new URL('/login?error=1', req.url))
  }

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) {
    return NextResponse.redirect(new URL('/login?error=1', req.url))
  }

  // Find org
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: { select: { id: true, slug: true } } },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) {
    return NextResponse.redirect(new URL('/login?error=1', req.url))
  }

  const effectiveRole = user.role === 'SUPERADMIN'
    ? 'SUPERADMIN'
    : membership.role === 'OWNER' ? 'ADMIN' : membership.role

  const redirectResponse = NextResponse.redirect(new URL('/dashboard', req.url))
  await setAuthCookiesOnResponse(
    redirectResponse,
    user.id,
    user.email,
    membership.organizationId,
    effectiveRole,
    user.tokenVersion,
  )

  logger.info('login_direct', { userId: user.id, email })

  return redirectResponse
}
