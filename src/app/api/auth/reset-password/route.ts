export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/server/prisma'
import { logger } from '@/lib/server/logger'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const { token, password } = parsed.data

  // Find the verification code
  const verification = await prisma.verificationCode.findFirst({
    where: {
      code: token,
      type: 'PASSWORD_RESET',
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: { select: { id: true, email: true } } },
  })

  if (!verification) {
    return NextResponse.json(
      { error: 'INVALID_OR_EXPIRED_TOKEN', message: 'Ce lien est invalide ou a expiré.' },
      { status: 400 },
    )
  }

  // Update password + mark code as used
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 }, // invalidate all existing sessions
      },
    }),
    prisma.verificationCode.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
  ])

  logger.info('password_reset_completed', { userId: verification.userId })

  return NextResponse.json({
    ok: true,
    message: 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.',
  })
}
