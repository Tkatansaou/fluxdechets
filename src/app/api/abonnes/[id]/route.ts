export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  telephone: z.string().min(8).optional(),
  adresse: z.string().optional(),
  zoneId: z.string().cuid().optional(),
  statut: z.enum(['à-jour', 'en-retard', 'impayé', 'inactif']).optional(),
  actif: z.boolean().optional(),
})

async function getAbonne(id: string, orgId: string) {
  return prisma.abonne.findFirst({
    where: { id, zone: { orgId } },
    include: {
      zone: { select: { nom: true } },
      paiements: { orderBy: { date: 'desc' }, take: 24 },
      marquages: {
        include: { tournee: { select: { date: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const abonne = await getAbonne(id, auth.orgId)
  if (!abonne) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ abonne })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = updateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })

  const existing = await prisma.abonne.findFirst({ where: { id, zone: { orgId: auth.orgId } } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const abonne = await prisma.abonne.update({
    where: { id },
    data: body.data,
    include: { zone: { select: { nom: true } } },
  })

  return NextResponse.json({ abonne })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const existing = await prisma.abonne.findFirst({ where: { id, zone: { orgId: auth.orgId } } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Soft delete (inactif)
  await prisma.abonne.update({ where: { id }, data: { actif: false, statut: 'inactif' } })

  return NextResponse.json({ ok: true })
}
