export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const createSchema = z.object({
  zoneId: z.string().cuid(),
  enginId: z.string().cuid(),
  chauffeurId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
})


export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const debut = searchParams.get('debut')
  const fin = searchParams.get('fin')

  const tournees = await prisma.tournee.findMany({
    where: {
      zone: { orgId: auth.orgId },
      ...(debut && fin ? { date: { gte: new Date(debut), lte: new Date(fin + 'T23:59:59') } } : {}),
    },
    include: {
      zone: { select: { nom: true } },
      engin: { select: { immatriculation: true, type: true } },
      chauffeur: { select: { name: true, email: true } },
      _count: { select: { marquages: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ tournees })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'MEMBER'])
  if (auth instanceof NextResponse) return auth

  const body = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  // Verify zone, engin, chauffeur all belong to org
  const [zone, engin, chauffeur] = await Promise.all([
    prisma.zone.findFirst({ where: { id: body.data.zoneId, orgId: auth.orgId } }),
    prisma.engin.findFirst({ where: { id: body.data.enginId, orgId: auth.orgId } }),
    prisma.organizationMember.findFirst({
      where: {
        userId: body.data.chauffeurId,
        organizationId: auth.orgId,
        role: { in: ['CHAUFFEUR', 'ADMIN', 'OWNER'] },
      },
    }),
  ])
  if (!zone) return NextResponse.json({ error: 'ZONE_NOT_FOUND' }, { status: 404 })
  if (!engin) return NextResponse.json({ error: 'ENGIN_NOT_FOUND' }, { status: 404 })
  if (!chauffeur) return NextResponse.json({ error: 'CHAUFFEUR_NOT_FOUND' }, { status: 404 })
  if (engin.statut === 'en-panne') return NextResponse.json({ error: 'ENGIN_EN_PANNE' }, { status: 422 })

  const tournee = await prisma.tournee.create({
    data: {
      ...body.data,
      date: new Date(body.data.date),
      statut: 'planifiée',
    },
    include: {
      zone: { select: { nom: true } },
      engin: { select: { immatriculation: true } },
      chauffeur: { select: { name: true } },
    },
  })

  return NextResponse.json({ tournee }, { status: 201 })
}
