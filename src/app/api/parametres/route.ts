export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const updateSchema = z.object({
  // Organization fields
  orgName: z.string().min(1).max(200).optional(),
  // DelegataireProfil / MairieProfil shared fields
  commune: z.string().max(200).optional(),
  telephone: z.string().max(30).optional(),
  adresse: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  budgetAnnuel: z.number().int().min(0).optional(),
  // DSP-specific fields (delegataire only)
  numContrat: z.string().max(100).optional(),
  dateContrat: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  objectifAbonnes: z.number().int().min(1).optional(),
  objectifRecouvrement: z.number().int().min(0).max(100).optional(),
  objectifCollecte: z.number().int().min(0).max(100).optional(),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const [org, prof] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: auth.orgId },
      select: { id: true, name: true, slug: true, typeOrg: true, createdAt: true },
    }),
    prisma.delegataireProfil.findUnique({
      where: { orgId: auth.orgId },
      select: {
        commune: true, telephone: true, adresse: true,
        region: true, budgetAnnuel: true,
        numContrat: true, dateContrat: true,
        objectifAbonnes: true, objectifRecouvrement: true, objectifCollecte: true,
        createdAt: true, updatedAt: true,
      },
    }),
  ])

  if (!org) return NextResponse.json({ error: 'ORG_NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ org, profil: prof })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN'])
  if (auth instanceof NextResponse) return auth

  const body = updateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const { orgName, dateContrat, ...profilData } = body.data

  const [org, profil] = await Promise.all([
    orgName
      ? prisma.organization.update({ where: { id: auth.orgId }, data: { name: orgName } })
      : prisma.organization.findUnique({ where: { id: auth.orgId }, select: { id: true, name: true } }),

    Object.keys(profilData).length > 0
      ? prisma.delegataireProfil.upsert({
          where: { orgId: auth.orgId },
          create: {
            orgId: auth.orgId,
            ...profilData,
            ...(dateContrat ? { dateContrat: new Date(dateContrat) } : {}),
          },
          update: {
            ...profilData,
            ...(dateContrat ? { dateContrat: new Date(dateContrat) } : {}),
          },
        })
      : null,
  ])

  return NextResponse.json({ org, profil })
}
