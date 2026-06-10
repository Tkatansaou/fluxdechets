export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/server/middleware'
import prisma from '@/lib/server/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin(req)
  if (auth instanceof NextResponse) return auth

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalOrgs,
    delegataires,
    mairies,
    newOrgsThisMonth,
    totalUsers,
    totalAbonnes,
    paiementsMois,
    paiementsMoisPrecedent,
    signupParMois,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { typeOrg: 'delegataire' } }),
    prisma.organization.count({ where: { typeOrg: 'mairie' } }),
    prisma.organization.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.abonne.count({ where: { actif: true } }),
    prisma.paiement.aggregate({
      where: { date: { gte: startOfMonth }, statut: 'validé' },
      _sum: { montant: true },
      _count: true,
    }),
    prisma.paiement.aggregate({
      where: { date: { gte: startOfLastMonth, lt: startOfMonth }, statut: 'validé' },
      _sum: { montant: true },
      _count: true,
    }),
    // Signups par mois (6 derniers mois)
    prisma.$queryRaw<{ mois: string; count: bigint }[]>`
      SELECT to_char("createdAt", 'YYYY-MM') as mois, COUNT(*) as count
      FROM "Organization"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY mois
      ORDER BY mois ASC
    `,
  ])

  const montantMois = paiementsMois._sum.montant ?? 0
  const montantMoisPrecedent = paiementsMoisPrecedent._sum.montant ?? 0
  const evolutionPaiements = montantMoisPrecedent > 0
    ? Math.round(((montantMois - montantMoisPrecedent) / montantMoisPrecedent) * 100)
    : null

  return NextResponse.json({
    stats: {
      totalOrgs,
      delegataires,
      mairies,
      newOrgsThisMonth,
      totalUsers,
      totalAbonnes,
      paiementsMois: { montant: montantMois, count: paiementsMois._count },
      evolutionPaiements,
      signupParMois: signupParMois.map(r => ({ mois: r.mois, count: Number(r.count) })),
    },
  })
}
