export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const createSchema = z.object({
  immatriculation: z.string().min(1).max(20),
  type: z.enum(['tricycle', 'camion-benne', 'charrette']),
  marque: z.string().optional(),
  modele: z.string().optional(),
  annee: z.number().int().min(2000).max(2030).optional(),
  kilometrage: z.number().int().min(0).default(0),
  dateAcquisition: z.string().optional(),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const engins = await prisma.engin.findMany({
    where: { orgId: auth.orgId },
    include: {
      pannes: { where: { statut: { in: ['ouverte', 'en-cours'] } }, select: { description: true, date: true } },
      _count: { select: { maintenances: true, carburants: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ engins })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'MEMBER'])
  if (auth instanceof NextResponse) return auth

  const body = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const engin = await prisma.engin.create({
    data: {
      ...body.data,
      orgId: auth.orgId,
      statut: 'opérationnel',
      ...(body.data.dateAcquisition ? { dateAcquisition: new Date(body.data.dateAcquisition) } : {}),
    },
  })

  return NextResponse.json({ engin }, { status: 201 })
}
