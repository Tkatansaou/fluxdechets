export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/middleware'
import prisma from '@/lib/server/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const now = new Date()
  const moisCourant = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const il30Jours = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [org, profil, abonnesActifs, paiementsMois, tourneesRecentes, zones, engins] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: auth.orgId },
      select: { name: true, slug: true },
    }),
    prisma.delegataireProfil.findUnique({
      where: { orgId: auth.orgId },
      select: {
        commune: true, telephone: true, adresse: true, region: true,
        numContrat: true, dateContrat: true,
        objectifAbonnes: true, objectifRecouvrement: true, objectifCollecte: true,
      },
    }),
    prisma.abonne.count({
      where: { zone: { orgId: auth.orgId }, actif: true },
    }),
    prisma.paiement.aggregate({
      where: {
        abonne: { zone: { orgId: auth.orgId } },
        moisConcerne: moisCourant,
        statut: 'validé',
      },
      _sum: { montant: true },
      _count: { _all: true },
    }),
    prisma.tournee.findMany({
      where: {
        zone: { orgId: auth.orgId },
        date: { gte: il30Jours },
      },
      select: { id: true, date: true, statut: true, zone: { select: { nom: true } } },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.zone.findMany({
      where: { orgId: auth.orgId },
      select: {
        id: true, nom: true, frequenceCollecte: true,
        _count: { select: { abonnes: true } },
      },
      orderBy: { nom: 'asc' },
    }),
    prisma.engin.findMany({
      where: { orgId: auth.orgId },
      select: { id: true, immatriculation: true, type: true, statut: true },
      orderBy: { immatriculation: 'asc' },
    }),
  ])

  const tourneesTotal = tourneesRecentes.length
  const tourneesTerminees = tourneesRecentes.filter(t => t.statut === 'terminée').length
  const tauxCollecte = tourneesTotal > 0 ? Math.round(tourneesTerminees / tourneesTotal * 100) : 0

  const montantMois = paiementsMois._sum.montant ?? 0
  const abonnesPayants = paiementsMois._count._all
  const tauxRecouvrement = abonnesActifs > 0 ? Math.round(abonnesPayants / abonnesActifs * 100) : 0

  return NextResponse.json({
    org,
    profil,
    kpis: {
      abonnesActifs,
      montantMoisCourant: montantMois,
      tauxRecouvrement,
      tauxCollecte,
      tourneesTotal,
      tourneesTerminees,
    },
    zones,
    engins,
    tourneesRecentes: tourneesRecentes.map(t => ({ ...t, date: t.date.toISOString().split('T')[0] })),
  })
}
