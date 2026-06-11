export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const createSchema = z.object({
  nom: z.string().min(1).max(100),
  categorie: z.enum(['carburant', 'epi', 'pieces-detachees', 'sacs-poubelle', 'autre']),
  unite: z.string().min(1).max(50),
  stockActuel: z.number().min(0).default(0),
  seuilAlerte: z.number().min(0).default(0),
  prixUnitaire: z.number().int().min(0).default(0),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const [consommables, mouvementsRecents] = await Promise.all([
    prisma.consommable.findMany({
      where: { orgId: auth.orgId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.mouvementStock.findMany({
      where: { consommable: { orgId: auth.orgId } },
      include: { consommable: { select: { id: true, nom: true, unite: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return NextResponse.json({ consommables, mouvementsRecents })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  // Ensure DelegataireProfil exists
  const prof = await prisma.delegataireProfil.findUnique({ where: { orgId: auth.orgId } })
  if (!prof) return NextResponse.json({ error: 'ORG_PROFILE_NOT_FOUND' }, { status: 404 })

  const consommable = await prisma.consommable.create({
    data: { ...body.data, orgId: auth.orgId },
  })

  return NextResponse.json({ consommable }, { status: 201 })
}
