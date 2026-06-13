export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/middleware'
import prisma from '@/lib/server/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const prof = await prisma.delegataireProfil.findUnique({
    where: { orgId: auth.orgId },
    select: { objectifAbonnes: true, objectifRecouvrement: true, objectifCollecte: true },
  })

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Parallel queries for performance
  const [abonnesActifs, abonnesAJour, engins, tourneesAll, pannesOuvertes, consommables] = await Promise.all([
    prisma.abonne.count({ where: { zone: { orgId: auth.orgId }, actif: true, statut: { not: 'inactif' } } }),
    prisma.abonne.count({ where: { zone: { orgId: auth.orgId }, statut: 'à-jour', actif: true } }),
    prisma.engin.findMany({ where: { orgId: auth.orgId }, select: { id: true, statut: true } }),
    prisma.tournee.findMany({
      where: { zone: { orgId: auth.orgId } },
      select: { statut: true },
    }),
    prisma.panneEngin.count({ where: { engin: { orgId: auth.orgId }, statut: { in: ['ouverte', 'en-cours'] } } }),
    prisma.consommable.findMany({
      where: { orgId: auth.orgId },
      select: { id: true, nom: true, stockActuel: true, seuilAlerte: true },
    }),
  ])

  const tauxRecouvrement = abonnesActifs > 0 ? Math.round((abonnesAJour / abonnesActifs) * 100) : 0
  const enginsOp = engins.filter(e => e.statut === 'opérationnel').length
  const tourneesNonAnnulees = tourneesAll.filter(t => t.statut !== 'annulée')
  const tourneesTerminees = tourneesAll.filter(t => t.statut === 'terminée')
  const tauxCollecte = tourneesNonAnnulees.length > 0
    ? Math.round((tourneesTerminees.length / tourneesNonAnnulees.length) * 100)
    : 100

  // Recouvrement par mois (6 derniers mois) — requête groupée unique
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const paiementsGrouped = await prisma.paiement.groupBy({
    by: ['moisConcerne'],
    where: {
      abonne: { zone: { orgId: auth.orgId } },
      moisConcerne: { gte: sixMonthsAgo.toISOString().slice(0, 7) },
      statut: 'validé',
    },
    _count: { moisConcerne: true },
  })
  const paiementsMap = new Map(paiementsGrouped.map(g => [g.moisConcerne, g._count.moisConcerne]))

  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const count = paiementsMap.get(moisKey) ?? 0
    const taux = abonnesActifs > 0 ? Math.min(Math.round((count / abonnesActifs) * 100), 100) : 0
    const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    months.push({ mois: MOIS[d.getMonth()], taux })
  }

  // Alertes
  const alertes: Array<{ id: string; type: string; titre: string; description: string; date: string; gravite: string; lien?: string }> = []

  if (pannesOuvertes > 0) {
    const pannes = await prisma.panneEngin.findMany({
      where: { engin: { orgId: auth.orgId }, statut: { in: ['ouverte', 'en-cours'] } },
      include: { engin: { select: { immatriculation: true } } },
      take: 5,
    })
    for (const p of pannes) {
      alertes.push({
        id: `panne-${p.id}`,
        type: 'panne-engin',
        titre: `Engin en panne : ${p.engin.immatriculation}`,
        description: p.description,
        date: p.date.toISOString().split('T')[0],
        gravite: 'critique',
        lien: '/engins',
      })
    }
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const tourneesAnnulees = await prisma.tournee.findMany({
    where: { zone: { orgId: auth.orgId }, statut: 'annulée', date: { gte: weekAgo } },
    include: { zone: { select: { nom: true } } },
    take: 3,
  })
  for (const t of tourneesAnnulees) {
    alertes.push({
      id: `tournee-${t.id}`,
      type: 'zone-non-couverte',
      titre: `Tournée annulée : ${t.zone.nom}`,
      description: t.notes ?? 'Tournée non effectuée',
      date: t.date.toISOString().split('T')[0],
      gravite: 'attention',
      lien: '/tournees',
    })
  }

  const stocksBas = consommables.filter(c => c.stockActuel <= c.seuilAlerte)
  for (const c of stocksBas.slice(0, 3)) {
    alertes.push({
      id: `stock-${c.id}`,
      type: 'stock-bas',
      titre: `Stock bas : ${c.nom}`,
      description: `${c.stockActuel} restant(s) — seuil : ${c.seuilAlerte}`,
      date: new Date().toISOString().split('T')[0],
      gravite: 'attention',
      lien: '/consommables',
    })
  }

  // Encaissé ce mois
  const encaisseMois = await prisma.paiement.aggregate({
    where: { abonne: { zone: { orgId: auth.orgId } }, moisConcerne: currentMonth, statut: 'validé' },
    _sum: { montant: true },
    _count: true,
  })

  return NextResponse.json({
    kpis: {
      abonnesActifs,
      objectifAbonnes: prof?.objectifAbonnes ?? 900,
      tauxRecouvrement,
      objectifRecouvrement: prof?.objectifRecouvrement ?? 80,
      tauxCollecte,
      objectifCollecte: prof?.objectifCollecte ?? 99,
      enginsOperationnels: enginsOp,
      enginsTotal: engins.length,
      alertesCount: alertes.length,
      recouvrementParMois: months,
      encaisseMoisMontant: encaisseMois._sum.montant ?? 0,
      encaisseMoisCount: encaisseMois._count,
    },
    alertes: alertes.sort((a, b) => {
      const order: Record<string, number> = { critique: 0, attention: 1, info: 2 }
      return (order[a.gravite] ?? 2) - (order[b.gravite] ?? 2)
    }),
  })
}
