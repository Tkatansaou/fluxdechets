export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const createSchema = z.object({
  nom: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  frequenceCollecte: z.enum(['bi-hebdomadaire', 'hebdomadaire']).default('bi-hebdomadaire'),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const zones = await prisma.zone.findMany({
    where: { orgId: auth.orgId },
    select: {
      id: true, nom: true, description: true, frequenceCollecte: true,
      _count: { select: { abonnes: true } },
    },
    orderBy: { nom: 'asc' },
  })

  return NextResponse.json({ zones })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const zone = await prisma.zone.create({
    data: { orgId: auth.orgId, ...body.data },
    select: {
      id: true, nom: true, description: true, frequenceCollecte: true,
      _count: { select: { abonnes: true } },
    },
  })

  return NextResponse.json({ zone }, { status: 201 })
}
