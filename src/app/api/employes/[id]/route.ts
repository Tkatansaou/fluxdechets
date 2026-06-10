export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const updateSchema = z.object({
  nom: z.string().min(1).max(100).optional(),
  prenom: z.string().min(1).max(100).optional(),
  telephone: z.string().min(8).max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  poste: z.enum(['chauffeur', 'agent-recouvrement', 'agent-collecte', 'superviseur', 'comptable', 'technicien', 'autre']).optional(),
  statut: z.enum(['actif', 'inactif', 'congé', 'suspendu']).optional(),
  dateEmbauche: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  salaire: z.number().int().min(0).optional(),
  zoneId: z.string().nullable().optional(),
  notes: z.string().max(500).optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const employe = await prisma.employe.findFirst({
    where: { id, orgId: auth.orgId },
    include: { zone: { select: { id: true, nom: true } } },
  })
  if (!employe) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ employe })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const existing = await prisma.employe.findFirst({ where: { id, orgId: auth.orgId } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const body = updateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const { dateEmbauche, zoneId, email, ...rest } = body.data

  if (zoneId) {
    const zone = await prisma.zone.findFirst({ where: { id: zoneId, orgId: auth.orgId } })
    if (!zone) return NextResponse.json({ error: 'ZONE_NOT_FOUND' }, { status: 404 })
  }

  const employe = await prisma.employe.update({
    where: { id },
    data: {
      ...rest,
      ...(email !== undefined ? { email: email || null } : {}),
      ...(zoneId !== undefined ? { zoneId: zoneId || null } : {}),
      ...(dateEmbauche ? { dateEmbauche: new Date(dateEmbauche) } : {}),
    },
    include: { zone: { select: { id: true, nom: true } } },
  })

  return NextResponse.json({ employe })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const existing = await prisma.employe.findFirst({ where: { id, orgId: auth.orgId } })
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  await prisma.employe.update({ where: { id }, data: { statut: 'inactif' } })

  return NextResponse.json({ success: true })
}
