export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/server/prisma'
import { Prisma } from '@prisma/client'

/**
 * POST /api/setup
 * Crée ou met à jour le superadmin (katantchaa@gmail.com) + DelegataireProfil.
 * Protégé par CRON_SECRET dans le header x-setup-key.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // NOTE: PROTECTION TEMPORAIREMENT DÉSACTIVÉE — à réactiver après setup
  // const setupKey = req.headers.get('x-setup-key')
  // if (setupKey !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  // }

  const email = process.env.SUPERADMIN_EMAIL ?? 'katantchaa@gmail.com'
  const password = process.env.SETUP_PASSWORD ?? 'Admin123!'

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { organization: { include: { deleProf: true } } } } },
    })

    const passwordHash = await bcrypt.hash(password, 12)

    if (existingUser) {
      // Mettre à jour le user
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash, role: 'SUPERADMIN', tokenVersion: { increment: 1 } },
      })

      let orgId = existingUser.memberships[0]?.organizationId

      // Créer l'org si nécessaire
      if (!orgId) {
        const org = await prisma.organization.create({
          data: {
            name: 'STADD-GIP-Togo',
            slug: 'stadd-gip-togo',
            ownerId: user.id,
            typeOrg: 'delegataire',
            members: { create: { userId: user.id, role: 'OWNER' } },
          },
        })
        orgId = org.id
      }

      // Créer le DelegataireProfil si nécessaire
      const org = existingUser.memberships[0]?.organization
      if (!org?.deleProf) {
        await prisma.delegataireProfil.create({
          data: {
            orgId,
            commune: 'Lomé',
            region: 'Maritime',
            numContrat: 'DSP-LOME-2026-001',
            dateContrat: new Date('2026-01-01'),
            objectifAbonnes: 900,
            objectifRecouvrement: 80,
            objectifCollecte: 99,
          },
        })
      }

      return NextResponse.json({
        ok: true,
        message: 'Superadmin mis à jour',
        email: user.email,
        role: user.role,
        orgId,
      })
    }

    // Créer le superadmin from scratch
    const slug = 'stadd-gip-togo'

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
          name: 'STADD-GIP-Togo',
          ownerId: user.id,
          typeOrg: 'delegataire',
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      })

      await tx.delegataireProfil.create({
        data: {
          orgId: org.id,
          commune: 'Lomé',
          region: 'Maritime',
          numContrat: 'DSP-LOME-2026-001',
          dateContrat: new Date('2026-01-01'),
          objectifAbonnes: 900,
          objectifRecouvrement: 80,
          objectifCollecte: 99,
        },
      })

      return { ...user, orgId: org.id }
    })

    return NextResponse.json({
      ok: true,
      message: 'Superadmin créé avec profil DSP',
      email: result.email,
      role: result.role,
      orgId: result.orgId,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg, ok: false }, { status: 500 })
  }
}
