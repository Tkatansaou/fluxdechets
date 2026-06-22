export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/server/prisma'
import { requireAuth } from '@/lib/server/middleware'
import { logger } from '@/lib/server/logger'

const schema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit faire au moins 8 caractères'),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? 'Données invalides'
      return NextResponse.json({ error: first }, { status: 422 })
    }

    const { currentPassword, newPassword } = parsed.data

    // Récupérer l'utilisateur avec son hash actuel
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    // Vérifier l'ancien mot de passe
    if (!user.passwordHash) {
      return NextResponse.json({ error: 'AUTH_METHOD_INVALID' }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'INVALID_CURRENT_PASSWORD' }, { status: 403 })
    }

    // Hasher et mettre à jour
    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 }, // Invalide les autres sessions
      },
    })

    logger.info('password_changed', { userId: auth.userId })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('change_password_error', { error: msg })
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
