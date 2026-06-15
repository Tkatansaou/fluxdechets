export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/server/prisma'
import { randomBytes } from 'node:crypto'
import { logger } from '@/lib/server/logger'
import { checkPasswordResetRateLimit } from '@/lib/server/ratelimit'
import { sendPasswordResetEmail } from '@/lib/server/email'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rl = await checkPasswordResetRateLimit(req)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'TOO_MANY_RESET_REQUESTS' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    )
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 422 })
  }

  const { email } = parsed.data

  // Always return 200 — don't leak whether the email exists (enumeration protection)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  })

  if (user) {
    // Invalidate any existing unused codes for this user
    await prisma.verificationCode.updateMany({
      where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() }, // expire them
    })

    const code = randomBytes(32).toString('hex')
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    // Non-blocking email send
    sendPasswordResetEmail(email, user.name ?? 'Utilisateur', code).catch(() => null)
    logger.info('password_reset_requested', { userId: user.id })
  }

  return NextResponse.json({
    ok: true,
    message: 'Si ce compte existe, un email de réinitialisation a été envoyé.',
  })
}
