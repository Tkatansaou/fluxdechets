export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const createSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  telephone: z.string().min(8),
  adresse: z.string().optional(),
  zoneId: z.string().cuid(),
  frequenceCollecte: z.enum(['hebdomadaire', 'bi-hebdomadaire']).default('bi-hebdomadaire'),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const zoneId = searchParams.get('zoneId')
  const statut = searchParams.get('statut')
  const search = searchParams.get('q')

  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const skip = (page - 1) * limit

  const where = {
    zone: { orgId: auth.orgId },
    ...(zoneId ? { zoneId } : {}),
    ...(statut && statut !== 'tous' ? { statut } : {}),
    ...(search ? {
      OR: [
        { nom: { contains: search, mode: 'insensitive' as const } },
        { prenom: { contains: search, mode: 'insensitive' as const } },
        { telephone: { contains: search } },
        { adresse: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [abonnes, total] = await Promise.all([
    prisma.abonne.findMany({
      where,
      include: { zone: { select: { id: true, nom: true } } },
      orderBy: [{ statut: 'asc' }, { nom: 'asc' }],
      take: limit,
      skip,
    }),
    prisma.abonne.count({ where }),
  ])

  return NextResponse.json({ abonnes, total, page, limit })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  // Verify zone belongs to org
  const zone = await prisma.zone.findFirst({
    where: { id: body.data.zoneId, orgId: auth.orgId },
  })
  if (!zone) return NextResponse.json({ error: 'ZONE_NOT_FOUND' }, { status: 404 })

  // Check duplicate telephone in org
  const dup = await prisma.abonne.findFirst({
    where: { telephone: body.data.telephone, zone: { orgId: auth.orgId }, actif: true },
    select: { id: true, prenom: true, nom: true },
  })
  if (dup) {
    return NextResponse.json({
      error: 'DUPLICATE_TELEPHONE',
      message: `Un abonné avec ce numéro existe déjà : ${dup.prenom} ${dup.nom}`,
    }, { status: 409 })
  }

  const abonne = await prisma.abonne.create({
    data: { ...body.data, statut: 'impayé' },
    include: { zone: { select: { id: true, nom: true } } },
  })

  return NextResponse.json({ abonne }, { status: 201 })
}
