export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const updateSchema = z.object({
  statut: z.enum(['planifiée', 'en-cours', 'terminée', 'annulée']).optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const tournee = await prisma.tournee.findFirst({
    where: { id, zone: { orgId: auth.orgId } },
    include: {
      zone: { select: { id: true, nom: true } },
      engin: { select: { id: true, immatriculation: true } },
      chauffeur: { select: { id: true, name: true } },
      marquages: { select: { id: true, abonneId: true, statut: true, motif: true, motifDetail: true, heureMarquage: true } },
    },
  })
  if (!tournee) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ tournee })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'MEMBER', 'CHAUFFEUR'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = updateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })

  const existing = await prisma.tournee.findFirst({ where: { id, zone: { orgId: auth.orgId } } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const tournee = await prisma.tournee.update({ where: { id }, data: body.data })
  return NextResponse.json({ tournee })
}

// NOTE: POST /api/tournees/[id]/marquages est géré par marquages/route.ts
