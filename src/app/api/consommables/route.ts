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

  const consommables = await prisma.consommable.findMany({
    where: { orgId: auth.orgId },
    include: {
      mouvements: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, type: true, quantite: true, date: true, motif: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ consommables })
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
