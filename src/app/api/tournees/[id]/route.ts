export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const updateSchema = z.object({
  statut: z.enum(['planifiée', 'en-cours', 'terminée', 'annulée']).optional(),
  notes: z.string().optional(),
})

const marquageSchema = z.object({
  abonneId: z.string().cuid(),
  statut: z.enum(['effectué', 'non-effectué']),
  motif: z.enum(['accès-bloqué', 'bac-absent', 'panne-engin', 'autre']).optional(),
  motifDetail: z.string().optional(),
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

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = updateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })

  const existing = await prisma.tournee.findFirst({ where: { id, zone: { orgId: auth.orgId } } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const tournee = await prisma.tournee.update({ where: { id }, data: body.data })
  return NextResponse.json({ tournee })
}

// POST /api/tournees/:id/marquages
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const url = new URL(req.url)
  if (!url.pathname.endsWith('/marquages')) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const body = marquageSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })

  const tournee = await prisma.tournee.findFirst({ where: { id, zone: { orgId: auth.orgId } } })
  if (!tournee) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const marquage = await prisma.marquage.upsert({
    where: { tourneeId_abonneId: { tourneeId: id, abonneId: body.data.abonneId } },
    create: {
      tourneeId: id,
      abonneId: body.data.abonneId,
      statut: body.data.statut,
      motif: body.data.motif,
      motifDetail: body.data.motifDetail,
      heureMarquage: new Date(),
    },
    update: {
      statut: body.data.statut,
      motif: body.data.motif,
      motifDetail: body.data.motifDetail,
      heureMarquage: new Date(),
    },
  })

  // Auto-set tournée to en-cours
  if (tournee.statut === 'planifiée') {
    await prisma.tournee.update({ where: { id }, data: { statut: 'en-cours' } })
  }

  return NextResponse.json({ marquage }, { status: 201 })
}
