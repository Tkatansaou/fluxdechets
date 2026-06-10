export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/server/middleware'
import prisma from '@/lib/server/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''
  const typeOrg = searchParams.get('type') ?? ''

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const orgs = await prisma.organization.findMany({
    where: {
      ...(typeOrg ? { typeOrg } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      typeOrg: true,
      createdAt: true,
      owner: { select: { email: true, name: true, status: true } },
      _count: { select: { members: true } },
      deleProf: {
        select: {
          commune: true,
          region: true,
          zones: {
            select: {
              _count: { select: { abonnes: { where: { actif: true } } } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get paiements this month per org (via abonne → zone → deleProf → orgId)
  const paiementsParOrg = await prisma.$queryRaw<{ orgId: string; montant: bigint; count: bigint }[]>`
    SELECT z."orgId", SUM(p.montant) as montant, COUNT(p.id) as count
    FROM "Paiement" p
    JOIN "Abonne" a ON p."abonneId" = a.id
    JOIN "Zone" z ON a."zoneId" = z.id
    WHERE p.date >= ${startOfMonth} AND p.statut = 'validé'
    GROUP BY z."orgId"
  `

  const paiementsMap = new Map(
    paiementsParOrg.map(r => [r.orgId, { montant: Number(r.montant), count: Number(r.count) }])
  )

  const result = orgs.map(org => {
    const totalAbonnes = org.deleProf?.zones.reduce((s, z) => s + z._count.abonnes, 0) ?? 0
    const pai = paiementsMap.get(org.id) ?? { montant: 0, count: 0 }
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      typeOrg: org.typeOrg,
      createdAt: org.createdAt,
      commune: org.deleProf?.commune ?? '',
      region: org.deleProf?.region ?? null,
      ownerEmail: org.owner.email,
      ownerName: org.owner.name,
      ownerStatus: org.owner.status,
      membresCount: org._count.members,
      abonnesActifs: totalAbonnes,
      paiementsMois: pai,
    }
  })

  return NextResponse.json({ orgs: result })
}
