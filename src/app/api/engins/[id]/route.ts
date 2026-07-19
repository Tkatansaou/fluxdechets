export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const panneSchema = z.object({
  description: z.string().min(1),
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
})

const maintenanceSchema = z.object({
  type: z.enum(['vidange', 'pneus', 'freins', 'moteur', 'carrosserie', 'révision-générale', 'autre']),
  description: z.string().optional(),
  cout: z.number().int().min(0).default(0),
  date: z.string(),
  prestataire: z.string().optional(),
  kilometrageLors: z.number().int().optional(),
})

const carburantSchema = z.object({
  litres: z.number().positive(),
  cout: z.number().int().positive(),
  kilometrage: z.number().int().positive(),
  date: z.string(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const engin = await prisma.engin.findFirst({
    where: { id, orgId: auth.orgId },
    include: {
      maintenances: { orderBy: { date: 'desc' } },
      carburants: { orderBy: { date: 'desc' } },
      pannes: { orderBy: { date: 'desc' } },
    },
  })
  if (!engin) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({ engin })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireRole(req, ['ADMIN', 'SUPERADMIN', 'MEMBER', 'CHAUFFEUR'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const raw = await req.json().catch(() => ({}))
  const { action, ...rest } = raw as { action?: string; [key: string]: unknown }

  const engin = await prisma.engin.findFirst({ where: { id, orgId: auth.orgId } })
  if (!engin) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (action === 'panne') {
    const body = panneSchema.safeParse(rest)
    if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })
    const panne = await prisma.$transaction(async tx => {
      const p = await tx.panneEngin.create({ data: { enginId: id, ...body.data, date: new Date(body.data.date) } })
      await tx.engin.update({ where: { id }, data: { statut: 'en-panne' } })
      return p
    })
    return NextResponse.json({ panne })
  }

  if (action === 'maintenance') {
    const body = maintenanceSchema.safeParse(rest)
    if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })
    const maintenance = await prisma.maintenance.create({
      data: { enginId: id, ...body.data, date: new Date(body.data.date) },
    })
    return NextResponse.json({ maintenance })
  }

  if (action === 'carburant') {
    const body = carburantSchema.safeParse(rest)
    if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 })
    const [carburant] = await prisma.$transaction([
      prisma.carburant.create({ data: { enginId: id, agentId: auth.userId, ...body.data, date: new Date(body.data.date) } }),
      prisma.engin.update({ where: { id }, data: { kilometrage: body.data.kilometrage } }),
    ])
    return NextResponse.json({ carburant })
  }

  if (action === 'resolve-panne') {
    const { panneId } = rest as { panneId: string }
    await prisma.$transaction(async tx => {
      await tx.panneEngin.update({ where: { id: panneId }, data: { statut: 'résolue', dateResolution: new Date() } })
      const openPannes = await tx.panneEngin.count({ where: { enginId: id, statut: { in: ['ouverte', 'en-cours'] } } })
      if (openPannes === 0) {
        await tx.engin.update({ where: { id }, data: { statut: 'opérationnel' } })
      }
    })
    return NextResponse.json({ ok: true })
  }

  // Generic update
  const updated = await prisma.engin.update({ where: { id }, data: rest as Record<string, unknown> })
  return NextResponse.json({ engin: updated })
}
