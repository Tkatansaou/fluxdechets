export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'
import { randomBytes } from 'node:crypto'

const createSchema = z.object({
  abonneId: z.string().cuid(),
  montant: z.number().int().positive().default(1000),
  moyen: z.enum(['mobile-money', 'espèces']),
  operateur: z.enum(['tmoney', 'flooz', 'moov']).optional(),
  moisConcerne: z.string().regex(/^\d{4}-\d{2}$/).default(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'RECOUVREMENT'])
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const mois = searchParams.get('mois')
  const zoneId = searchParams.get('zoneId')

  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)
  const skip = (page - 1) * limit

  const where = {
    abonne: { zone: { orgId: auth.orgId } },
    ...(mois ? { moisConcerne: mois } : {}),
    ...(zoneId ? { abonne: { zoneId } } : {}),
    statut: 'validé',
  }

  const [paiements, total] = await Promise.all([
    prisma.paiement.findMany({
      where,
      include: {
        abonne: { select: { nom: true, prenom: true, zone: { select: { id: true, nom: true } } } },
        agent: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip,
    }),
    prisma.paiement.count({ where }),
  ])

  return NextResponse.json({ paiements, total, page, limit })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'RECOUVREMENT'])
  if (auth instanceof NextResponse) return auth

  const body = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  // Verify abonné belongs to org
  const abonne = await prisma.abonne.findFirst({
    where: { id: body.data.abonneId, zone: { orgId: auth.orgId }, actif: true },
  })
  if (!abonne) return NextResponse.json({ error: 'ABONNE_NOT_FOUND' }, { status: 404 })

  const reference = 'WF' + randomBytes(4).toString('hex').toUpperCase()

  const paiement = await prisma.$transaction(async tx => {
    const p = await tx.paiement.create({
      data: {
        abonneId: body.data.abonneId,
        agentId: auth.userId,
        montant: body.data.montant,
        moyen: body.data.moyen,
        operateur: body.data.operateur,
        statut: 'validé',
        reference,
        moisConcerne: body.data.moisConcerne,
        date: new Date(),
      },
      include: { abonne: { select: { nom: true, prenom: true } } },
    })

    // Update abonné status
    await tx.abonne.update({ where: { id: body.data.abonneId }, data: { statut: 'à-jour' } })

    return p
  })

  return NextResponse.json({ paiement }, { status: 201 })
}
