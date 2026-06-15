export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/middleware'
import prisma from '@/lib/server/prisma'
import { toCsv, csvHeaders } from '@/lib/server/export'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'abonnes'

  switch (type) {
    case 'abonnes': {
      const abonnes = await prisma.abonne.findMany({
        where: { zone: { orgId: auth.orgId }, actif: true },
        include: { zone: { select: { nom: true } } },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      })

      const rows = abonnes.map(a => ({
        nom: a.nom,
        prenom: a.prenom,
        telephone: a.telephone,
        adresse: a.adresse ?? '',
        zone: a.zone.nom,
        statut: a.statut,
        frequence: a.frequenceCollecte,
        inscrit_le: a.createdAt.toISOString().split('T')[0],
      }))

      const csv = toCsv(rows, [
        { key: 'nom', label: 'Nom' },
        { key: 'prenom', label: 'Prénom' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'adresse', label: 'Adresse' },
        { key: 'zone', label: 'Zone' },
        { key: 'statut', label: 'Statut' },
        { key: 'frequence', label: 'Fréquence' },
        { key: 'inscrit_le', label: 'Inscrit le' },
      ])

      return new NextResponse(csv, {
        headers: csvHeaders(`abonnes-${auth.orgId.slice(0, 8)}.csv`),
      })
    }

    case 'paiements': {
      const paiements = await prisma.paiement.findMany({
        where: { abonne: { zone: { orgId: auth.orgId } } },
        include: { abonne: { select: { nom: true, prenom: true, telephone: true } } },
        orderBy: { date: 'desc' },
        take: 5000,
      })

      const rows = paiements.map(p => ({
        reference: p.reference,
        abonne: `${p.abonne.prenom} ${p.abonne.nom}`,
        telephone: p.abonne.telephone,
        montant: p.montant.toString(),
        moyen: p.moyen,
        operateur: p.operateur ?? '',
        statut: p.statut,
        mois: p.moisConcerne,
        date: p.date.toISOString().split('T')[0],
      }))

      const csv = toCsv(rows, [
        { key: 'reference', label: 'Référence' },
        { key: 'abonne', label: 'Abonné' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'montant', label: 'Montant (FCFA)' },
        { key: 'moyen', label: 'Moyen' },
        { key: 'operateur', label: 'Opérateur' },
        { key: 'statut', label: 'Statut' },
        { key: 'mois', label: 'Mois concerné' },
        { key: 'date', label: 'Date' },
      ])

      return new NextResponse(csv, {
        headers: csvHeaders(`paiements-${auth.orgId.slice(0, 8)}.csv`),
      })
    }

    case 'tournees': {
      const tournees = await prisma.tournee.findMany({
        where: { zone: { orgId: auth.orgId } },
        include: {
          zone: { select: { nom: true } },
          engin: { select: { immatriculation: true } },
          chauffeur: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: 2000,
      })

      const rows = tournees.map(t => ({
        date: t.date.toISOString().split('T')[0],
        zone: t.zone.nom,
        engin: t.engin.immatriculation,
        chauffeur: t.chauffeur.name ?? '',
        statut: t.statut,
        notes: t.notes ?? '',
      }))

      const csv = toCsv(rows, [
        { key: 'date', label: 'Date' },
        { key: 'zone', label: 'Zone' },
        { key: 'engin', label: 'Engin' },
        { key: 'chauffeur', label: 'Chauffeur' },
        { key: 'statut', label: 'Statut' },
        { key: 'notes', label: 'Notes' },
      ])

      return new NextResponse(csv, {
        headers: csvHeaders(`tournees-${auth.orgId.slice(0, 8)}.csv`),
      })
    }

    case 'engins': {
      const engins = await prisma.engin.findMany({
        where: { orgId: auth.orgId },
        orderBy: { createdAt: 'desc' },
      })

      const rows = engins.map(e => ({
        immatriculation: e.immatriculation,
        type: e.type,
        marque: e.marque ?? '',
        modele: e.modele ?? '',
        annee: e.annee?.toString() ?? '',
        statut: e.statut,
        kilometrage: e.kilometrage.toString(),
      }))

      const csv = toCsv(rows, [
        { key: 'immatriculation', label: 'Immatriculation' },
        { key: 'type', label: 'Type' },
        { key: 'marque', label: 'Marque' },
        { key: 'modele', label: 'Modèle' },
        { key: 'annee', label: 'Année' },
        { key: 'statut', label: 'Statut' },
        { key: 'kilometrage', label: 'Kilométrage' },
      ])

      return new NextResponse(csv, {
        headers: csvHeaders(`engins-${auth.orgId.slice(0, 8)}.csv`),
      })
    }

    case 'employes': {
      const employes = await prisma.employe.findMany({
        where: { orgId: auth.orgId, statut: 'actif' },
        include: { zone: { select: { nom: true } } },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      })

      const rows = employes.map(e => ({
        nom: e.nom,
        prenom: e.prenom,
        telephone: e.telephone,
        email: e.email ?? '',
        poste: e.poste,
        zone: e.zone?.nom ?? '',
        salaire: e.salaire?.toString() ?? '',
        dateEmbauche: e.dateEmbauche?.toISOString().split('T')[0] ?? '',
      }))

      const csv = toCsv(rows, [
        { key: 'nom', label: 'Nom' },
        { key: 'prenom', label: 'Prénom' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'email', label: 'Email' },
        { key: 'poste', label: 'Poste' },
        { key: 'zone', label: 'Zone' },
        { key: 'salaire', label: 'Salaire (FCFA)' },
        { key: 'dateEmbauche', label: 'Date embauche' },
      ])

      return new NextResponse(csv, {
        headers: csvHeaders(`employes-${auth.orgId.slice(0, 8)}.csv`),
      })
    }

    default:
      return NextResponse.json({ error: 'INVALID_EXPORT_TYPE' }, { status: 400 })
  }
}
