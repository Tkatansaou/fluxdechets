export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const updateSchema = z.object({
  nom: z.string().min(1).max(100).optional(),
  categorie: z.enum(['carburant', 'epi', 'pieces-detachees', 'sacs-poubelle', 'autre']).optional(),
  unite: z.string().min(1).max(50).optional(),
  seuilAlerte: z.number().min(0).optional(),
  prixUnitaire: z.number().int().min(0).optional(),
})

const mouvementSchema = z.object({
  type: z.enum(['entrée', 'sortie']),
  quantite: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  motif: z.string().max(200).optional(),
})

type Params = { params: Promise<{ id: string }> }

async function getConsommable(id: string, orgId: string) {
  return prisma.consommable.findFirst({ where: { id, orgId } })
}

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'MEMBER'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const consommable = await prisma.consommable.findFirst({
    where: { id, orgId: auth.orgId },
    include: {
      mouvements: {
        orderBy: { createdAt: 'desc' },
        include: { agent: { select: { name: true, email: true } } },
      },
    },
  })
  if (!consommable) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ consommable })
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'MEMBER'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const existing = await getConsommable(id, auth.orgId)
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const body = updateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const consommable = await prisma.consommable.update({
    where: { id },
    data: body.data,
  })

  return NextResponse.json({ consommable })
}

// POST /api/consommables/[id] with ?action=mouvement adds a stock movement
export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'MEMBER'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const existing = await getConsommable(id, auth.orgId)
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const body = mouvementSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const { type, quantite, motif } = body.data
  const date = body.data.date ? new Date(body.data.date) : new Date()

  // Prevent negative stock
  if (type === 'sortie' && existing.stockActuel < quantite) {
    return NextResponse.json({ error: 'STOCK_INSUFFISANT', message: `Stock insuffisant : ${existing.stockActuel} ${existing.unite} disponible(s)` }, { status: 409 })
  }

  const delta = type === 'entrée' ? quantite : -quantite

  const [mouvement] = await prisma.$transaction([
    prisma.mouvementStock.create({
      data: {
        consommableId: id,
        agentId: auth.userId,
        type,
        quantite,
        date,
        motif: motif ?? (type === 'entrée' ? 'Approvisionnement' : 'Consommation'),
      },
    }),
    prisma.consommable.update({
      where: { id },
      data: { stockActuel: { increment: delta } },
    }),
  ])

  return NextResponse.json({ mouvement }, { status: 201 })
}
