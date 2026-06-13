export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/server/middleware'
import { verifyCsrf } from '@/lib/server/auth'
import prisma from '@/lib/server/prisma'

const generateSchema = z.object({
  trimestre: z.enum(['T1', 'T2', 'T3', 'T4']),
  annee: z.number().int().min(2020).max(2100),
})

function trimestreMois(trimestre: string, annee: number): string[] {
  const map: Record<string, number[]> = {
    T1: [1, 2, 3],
    T2: [4, 5, 6],
    T3: [7, 8, 9],
    T4: [10, 11, 12],
  }
  return (map[trimestre] ?? []).map(m => `${annee}-${String(m).padStart(2, '0')}`)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const rapports = await prisma.rapport.findMany({
    where: { orgId: auth.orgId },
    orderBy: [{ annee: 'desc' }, { trimestre: 'desc' }],
  })

  return NextResponse.json({ rapports })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = generateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'VALIDATION_ERROR', issues: body.error.issues }, { status: 422 })

  const { trimestre, annee } = body.data
  const mois = trimestreMois(trimestre, annee)
  const debutTrimestre = new Date(`${annee}-${mois[0].slice(5)}-01`)
  const finTrimestre = new Date(debutTrimestre)
  finTrimestre.setMonth(debutTrimestre.getMonth() + 3)
  finTrimestre.setMilliseconds(-1)

  // Compute report data from DB
  const [abonnesActifs, paiements, tournees, engins, pannes] = await Promise.all([
    prisma.abonne.count({
      where: { zone: { orgId: auth.orgId }, actif: true, statut: { not: 'inactif' } },
    }),
    prisma.paiement.findMany({
      where: { abonne: { zone: { orgId: auth.orgId } }, moisConcerne: { in: mois }, statut: 'validé' },
      select: { montant: true, moyen: true, moisConcerne: true },
    }),
    prisma.tournee.findMany({
      where: { zone: { orgId: auth.orgId }, date: { gte: debutTrimestre, lte: finTrimestre } },
      select: { statut: true },
    }),
    prisma.engin.findMany({
      where: { orgId: auth.orgId },
      select: { id: true, immatriculation: true, statut: true, kilometrage: true },
    }),
    prisma.panneEngin.findMany({
      where: { engin: { orgId: auth.orgId }, date: { gte: debutTrimestre } },
      select: { description: true, statut: true, coutReparation: true },
    }),
  ])

  const montantTotal = paiements.reduce((s, p) => s + p.montant, 0)
  const montantMM = paiements.filter(p => p.moyen === 'mobile-money').reduce((s, p) => s + p.montant, 0)
  const montantEspeces = paiements.filter(p => p.moyen === 'espèces').reduce((s, p) => s + p.montant, 0)

  const tauxParMois = mois.map(m => {
    const pays = paiements.filter(p => p.moisConcerne === m).length
    return { mois: m, paiements: pays, taux: abonnesActifs > 0 ? Math.round((pays / abonnesActifs) * 100) : 0 }
  })
  const tauxRecouvrementGlobal = Math.round(tauxParMois.reduce((s, m) => s + m.taux, 0) / tauxParMois.length)

  const tourneesNonAnnulees = tournees.filter(t => t.statut !== 'annulée').length
  const tourneesTerminees = tournees.filter(t => t.statut === 'terminée').length
  const tauxCollecte = tourneesNonAnnulees > 0 ? Math.round((tourneesTerminees / tourneesNonAnnulees) * 100) : 100

  const donnees = {
    abonnes_actifs: abonnesActifs,
    montant_total: montantTotal,
    montant_mobile_money: montantMM,
    montant_especes: montantEspeces,
    taux_recouvrement_global: tauxRecouvrementGlobal,
    taux_collecte: tauxCollecte,
    recouvrement_par_mois: tauxParMois,
    tournees_total: tourneesNonAnnulees,
    tournees_terminees: tourneesTerminees,
    engins: engins.map(e => ({ immatriculation: e.immatriculation, statut: e.statut, kilometrage: e.kilometrage })),
    pannes_count: pannes.length,
    pannes_cout_total: pannes.reduce((s, p) => s + (p.coutReparation ?? 0), 0),
    generated_at: new Date().toISOString(),
  }

  const rapport = await prisma.rapport.upsert({
    where: { orgId_trimestre_annee: { orgId: auth.orgId, trimestre, annee } },
    create: { orgId: auth.orgId, trimestre, annee, statut: 'brouillon', donnees, generatedAt: new Date() },
    update: { donnees, generatedAt: new Date(), statut: 'brouillon' },
  })

  return NextResponse.json({ rapport }, { status: 201 })
}
