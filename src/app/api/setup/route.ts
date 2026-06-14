export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/server/prisma'
import { Prisma } from '@prisma/client'

/**
 * POST /api/setup
 * Crée le superadmin initial (katantchaa@gmail.com) si pas encore SUPERADMIN.
 * Protégé par un token maître passé dans le header X-Setup-Key.
 * À désactiver après usage ou protéger par CRON_SECRET.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Vérifier le secret — seul le propriétaire peut appeler cette route
  const setupKey = req.headers.get('x-setup-key')
  if (setupKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const email = 'katantchaa@gmail.com'
  const password = 'Admin123!' // mot de passe temporaire

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { organizationMembers: true },
    })

    if (existingUser) {
      // Mettre à jour le mot de passe et le rôle
      const passwordHash = await bcrypt.hash(password, 12)
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          role: 'SUPERADMIN',
          tokenVersion: { increment: 1 },
        },
      })

      // S'assurer qu'il a une organisation
      let orgId = existingUser.organizationMembers[0]?.organizationId
      if (!orgId) {
        const org = await prisma.organization.create({
          data: {
            name: 'WasteFlow Admin',
            slug: 'wasteflow-admin-' + Date.now().toString(36),
            ownerId: user.id,
            typeOrg: 'delegataire',
            members: {
              create: { userId: user.id, role: 'OWNER' },
            },
          },
        })
        orgId = org.id
      }

      return NextResponse.json({
        ok: true,
        message: 'Superadmin mis à jour',
        email: user.email,
        role: user.role,
        orgId,
        password: 'Admin123!',
      })
    }

    // Créer le superadmin
    const passwordHash = await bcrypt.hash(password, 12)
    const slug = 'wasteflow-admin-' + Date.now().toString(36)

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: 'Tchaa Katansaou',
          role: 'SUPERADMIN',
          emailVerifiedAt: new Date(),
        },
      })

      const org = await tx.organization.create({
        data: {
          slug,
          name: 'WasteFlow Admin',
          ownerId: user.id,
          typeOrg: 'delegataire',
          members: {
            create: { userId: user.id, role: 'OWNER' },
          },
        },
      })

      return { ...user, orgId: org.id }
    })

    return NextResponse.json({
      ok: true,
      message: 'Superadmin créé',
      email: result.email,
      role: result.role,
      orgId: result.orgId,
      password: 'Admin123!',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg, ok: false }, { status: 500 })
  }
}
