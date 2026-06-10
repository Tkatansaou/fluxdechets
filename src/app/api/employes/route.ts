export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const POSTES = ['chauffeur', 'agent-recouvrement', 'agent-collecte', 'superviseur', 'comptable', 'technicien', 'autre'] as const
const STATUTS = ['actif', 'inactif', 'congé', 'suspendu'] as const

const createSchema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  telephone: z.string().min(8).max(30),
  email: z.string().email().optional().or(z.literal('')),
  poste: z.enum(POSTES),
  statut: z.enum(STATUTS).default('actif'),
  dateEmbauche: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  salaire: z.number().int().min(0).optional(),
  zoneId: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut')
  const poste = searchParams.get('poste')

  const employes = await prisma.employe.findMany({
    where: {
      orgId: auth.orgId,
      ...(statut ? { statut } : {}),
      ...(poste ? { poste } : {}),
    },
    include: {
      zone: { select: { id: true, nom: true } },
    },
    orderBy: [{ statut: 'asc' }, { nom: 'asc' }],
  })

  const stats = {
    total: employes.length,
    actifs: employes.filter(e => e.statut === 'actif').length,
    inactifs: employes.filter(e => e.statut === 'inactif').length,
    conge: employes.filter(e => e.statut === 'congé').length,
    suspendus: employes.filter(e => e.statut === 'suspendu').length,
    masseSalariale: employes.filter(e => e.statut === 'actif').reduce((s, e) => s + (e.salaire ?? 0), 0),
  }

  return NextResponse.json({ employes, stats })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const { dateEmbauche, email, zoneId, ...rest } = body.data

  // Verify zone belongs to this org
  if (zoneId) {
    const zone = await prisma.zone.findFirst({ where: { id: zoneId, orgId: auth.orgId } })
    if (!zone) return NextResponse.json({ error: 'ZONE_NOT_FOUND' }, { status: 404 })
  }

  const employe = await prisma.employe.create({
    data: {
      ...rest,
      orgId: auth.orgId,
      ...(email ? { email } : {}),
      ...(zoneId ? { zoneId } : {}),
      ...(dateEmbauche ? { dateEmbauche: new Date(dateEmbauche) } : {}),
    },
    include: { zone: { select: { id: true, nom: true } } },
  })

  return NextResponse.json({ employe }, { status: 201 })
}
