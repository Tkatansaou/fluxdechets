export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/server/prisma'
import { issueAuthCookies } from '@/lib/server/auth'
import { logger } from '@/lib/server/logger'
import { checkLoginRateLimit } from '@/lib/server/ratelimit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rl = await checkLoginRateLimit(req)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'TOO_MANY_LOGIN_ATTEMPTS' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 422 })
  }
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, status: true, tokenVersion: true, name: true },
  })

  // Constant-time hash comparison to prevent timing attacks
  const dummyHash = '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  const hashToCheck = user?.passwordHash ?? dummyHash
  const match = await bcrypt.compare(password, hashToCheck)

  if (!user || !match || !user.passwordHash) {
    logger.warn('login_failed', { email })
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
  }

  if (user.status === 'SUSPENDED') {
    return NextResponse.json({ error: 'ACCOUNT_SUSPENDED' }, { status: 403 })
  }

  // Find the user's organisation
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!membership) {
    logger.error('login_no_org', { userId: user.id })
    return NextResponse.json({ error: 'ORG_NOT_FOUND' }, { status: 500 })
  }

  logger.info('login_ok', { userId: user.id })

  const { csrfToken } = await issueAuthCookies(
    user.id,
    user.email,
    membership.organizationId,
    membership.role === 'OWNER' ? 'ADMIN' : membership.role,
    user.tokenVersion,
  )

  return NextResponse.json({ ok: true, csrfToken })
}
