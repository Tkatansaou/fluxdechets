export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, issueAuthCookies } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const COOKIE_PREFIX = process.env.NEXT_PUBLIC_COOKIE_PREFIX ?? 'wf'

export async function POST(_req: NextRequest): Promise<NextResponse> {
  const jar = await cookies()
  const refreshToken = jar.get(`${COOKIE_PREFIX}-refresh`)?.value
  if (!refreshToken) return NextResponse.json({ error: 'NO_REFRESH_TOKEN' }, { status: 401 })

  const payload = await verifyToken(refreshToken)
  if (!payload || payload.type !== 'refresh') {
    return NextResponse.json({ error: 'INVALID_REFRESH_TOKEN' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { status: true, tokenVersion: true, email: true, role: true },
  })
  if (!user || user.status === 'SUSPENDED' || user.tokenVersion !== payload.tv) {
    return NextResponse.json({ error: 'SESSION_REVOKED' }, { status: 401 })
  }

  // Re-read membership role in case it changed since last token was issued
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: payload.sub, organizationId: payload.orgId },
    select: { role: true },
  })
  const currentRole = user.role === 'SUPERADMIN'
    ? 'SUPERADMIN'
    : membership?.role === 'OWNER' ? 'ADMIN' : (membership?.role ?? 'USER')

  const { csrfToken } = await issueAuthCookies(
    payload.sub,
    user.email,
    payload.orgId,
    currentRole,
    user.tokenVersion,
  )

  return NextResponse.json({ ok: true, csrfToken })
}
