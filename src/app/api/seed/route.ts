export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/server/prisma'

/**
 * POST /api/seed
 * Seed production — alimente la base avec données de démo réalistes.
 * Protégé par CRON_SECRET via header Authorization: Bearer <secret>.
 * SUPPRIMER après exécution ! (one-shot)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? 'katantchaa@gmail.com'

    // 1. Récupérer le user SUPERADMIN
    const user = await prisma.user.findUnique({
      where: { email: SUPERADMIN_EMAIL },
      include: { ownedOrgs: { take: 1, include: { deleProf: true } } },
    })
    if (!user || !user.ownedOrgs.length) {
      return NextResponse.json({ error: 'User/org not found. Run /api/setup first.' }, { status: 400 })
    }

    const org = user.ownedOrgs[0]!
    const orgId = org.id
    const results: string[] = [`Org: ${org.name} (${orgId})`]

    // 2. DelegataireProfil
    await prisma.delegataireProfil.upsert({
      where: { orgId },
      update: {},
      create: { orgId, commune: 'Lomé', region: 'Maritime', numContrat: 'DSP-LOME-2026-001', dateContrat: new Date('2026-01-01'), objectifAbonnes: 900, objectifRecouvrement: 80, objectifCollecte: 99 },
    })
    results.push('✓ DelegataireProfil')

    // 3. Zones
    const zonesData = [
      { nom: 'Tokoin', desc: 'Quartier Tokoin — résidentiel et commerces', freq: 'bi-hebdomadaire' },
      { nom: 'Tokoin-Ouest', desc: 'Extension ouest de Tokoin', freq: 'bi-hebdomadaire' },
      { nom: 'Bè', desc: 'Quartier Bè — centre-ville historique', freq: 'bi-hebdomadaire' },
      { nom: 'Doumasséssé', desc: 'Zone industrielle et périphérique', freq: 'hebdomadaire' },
    ]
    const zoneMap: Record<string, string> = {}
    for (const z of zonesData) {
      const existing = await prisma.zone.findFirst({ where: { orgId, nom: z.nom } })
      if (existing) { zoneMap[z.nom] = existing.id; continue }
      const c = await prisma.zone.create({ data: { orgId, nom: z.nom, description: z.desc, frequenceCollecte: z.freq } })
      zoneMap[z.nom] = c.id
    }
    results.push(`✓ ${Object.keys(zoneMap).length} zones`)

    // 4. Abonnés
    const abonnesData = [
      { zone: 'Tokoin', nom: 'Mensah', prenom: 'Koffi', tel: '+22890003456', adresse: 'Rue de la Paix N°12', statut: 'impayé' as const },
      { zone: 'Tokoin', nom: 'Sodji', prenom: 'Afi', tel: '+22890004567', adresse: 'Av. de l\'Indépendance', statut: 'à-jour' as const },
      { zone: 'Tokoin', nom: 'Dossou', prenom: 'Yawa', tel: '+22890005678', adresse: 'Quartier Admin', statut: 'à-jour' as const },
      { zone: 'Tokoin-Ouest', nom: 'Agbeko', prenom: 'Kokou', tel: '+22890006789', adresse: 'Ruelle église', statut: 'à-jour' as const },
      { zone: 'Tokoin-Ouest', nom: 'Komlan', prenom: 'Akosua', tel: '+22890007890', adresse: 'Cité B12', statut: 'en-retard' as const },
      { zone: 'Tokoin-Ouest', nom: 'Teteh', prenom: 'Abla', tel: '+22890008901', adresse: 'Av. du Marché', statut: 'impayé' as const },
      { zone: 'Bè', nom: 'Hounkpe', prenom: 'Enyonam', tel: '+22890009012', adresse: 'Marché central, lot 4B', statut: 'à-jour' as const },
      { zone: 'Bè', nom: 'Djakou', prenom: 'Selom', tel: '+22890000123', adresse: 'Derrière marché', statut: 'à-jour' as const },
      { zone: 'Bè', nom: 'Attiogbe', prenom: 'Marcel', tel: '+22890001234', adresse: 'Rue Komlan N°8', statut: 'à-jour' as const },
      { zone: 'Doumasséssé', nom: 'Lawson', prenom: 'Precious', tel: '+22890002345', adresse: 'Zone industrielle', statut: 'à-jour' as const },
      { zone: 'Doumasséssé', nom: 'Vodounou', prenom: 'Samuel', tel: '+22890003457', adresse: 'Carrefour nord', statut: 'impayé' as const },
      { zone: 'Doumasséssé', nom: 'Avlessi', prenom: 'Komlan', tel: '+22890004568', adresse: 'Lot 18, extension', statut: 'en-retard' as const },
    ]

    let abCount = 0
    const aJourIds: string[] = []
    const zoneIdMap: Record<string, string> = {}
    for (const z of zonesData) zoneIdMap[z.nom] = zoneMap[z.nom]!

    for (const ab of abonnesData) {
      const zoneId = zoneIdMap[ab.zone]
      if (!zoneId) continue
      const existing = await prisma.abonne.findFirst({ where: { zoneId, telephone: ab.tel } })
      if (existing) {
        if (existing.statut === 'à-jour' || existing.statut === 'en-retard') aJourIds.push(existing.id)
        continue
      }
      const created = await prisma.abonne.create({
        data: { zoneId, nom: ab.nom, prenom: ab.prenom, telephone: ab.tel, adresse: ab.adresse, statut: ab.statut, actif: true, dateInscription: new Date('2025-06-01') },
      })
      abCount++
      if (ab.statut === 'à-jour' || ab.statut === 'en-retard') aJourIds.push(created.id)
    }
    results.push(`✓ ${abCount} abonnés créés, ${aJourIds.length} à jour`)

    // 5. Engins
    const enginsData = [
      { immat: 'TRI-001', type: 'tricycle', marque: 'Yamaha', statut: 'opérationnel', km: 12450 },
      { immat: 'TRI-002', type: 'tricycle', marque: 'Honda', statut: 'en-panne', km: 8730 },
      { immat: 'CAM-001', type: 'camion-benne', marque: 'Isuzu', statut: 'opérationnel', km: 45200 },
      { immat: 'CHA-001', type: 'charrette', marque: 'Locale', statut: 'opérationnel', km: 3200 },
    ]
    let engCount = 0
    for (const e of enginsData) {
      const existing = await prisma.engin.findFirst({ where: { orgId, immatriculation: e.immat } })
      if (existing) continue
      await prisma.engin.create({
        data: { orgId, immatriculation: e.immat, type: e.type, marque: e.marque, modele: e.type === 'tricycle' ? 'Alpha 110' : e.type === 'camion-benne' ? 'NPR 75L' : 'Standard', annee: 2022, statut: e.statut, kilometrage: e.km, dateAcquisition: new Date('2022-03-15') },
      })
      engCount++
    }
    results.push(`✓ ${engCount} engins créés`)

    // 6. Paiements (juin 2026)
    const mois = '2026-06'
    let paiementCount = 0
    for (let i = 0; i < aJourIds.length; i++) {
      const abId = aJourIds[i]!
      const ref = `WF-SEED-${mois}-${i}`
      const existing = await prisma.paiement.findUnique({ where: { reference: ref } })
      if (existing) continue
      await prisma.paiement.create({
        data: { abonneId: abId, agentId: user.id, montant: 1000, moyen: i % 3 === 0 ? 'mobile-money' : 'espèces', operateur: i % 3 === 0 ? (i % 6 === 0 ? 'tmoney' : 'flooz') : undefined, statut: 'validé', reference: ref, moisConcerne: mois, date: new Date(`2026-06-0${(i % 9) + 1}`) },
      })
      paiementCount++
      await prisma.abonne.update({ where: { id: abId }, data: { statut: 'à-jour' } })
    }
    results.push(`✓ ${paiementCount} paiements (juin 2026)`)

    // 7. Consommables
    const consomData = [
      { nom: 'Gazole (carburant)', cat: 'carburant', unite: 'litres', stock: 45, seuil: 50, prix: 700 },
      { nom: 'Gants de protection', cat: 'epi', unite: 'paires', stock: 12, seuil: 20, prix: 800 },
      { nom: 'Sacs poubelle 50L', cat: 'sacs-poubelle', unite: 'sacs', stock: 340, seuil: 100, prix: 150 },
      { nom: 'Huile moteur 20W50', cat: 'pieces-detachees', unite: 'litres', stock: 3, seuil: 5, prix: 2500 },
    ]
    let consCount = 0
    for (const c of consomData) {
      const existing = await prisma.consommable.findFirst({ where: { orgId, nom: c.nom } })
      if (existing) continue
      await prisma.consommable.create({ data: { orgId, nom: c.nom, categorie: c.cat, unite: c.unite, stockActuel: c.stock, seuilAlerte: c.seuil, prixUnitaire: c.prix } })
      consCount++
    }
    results.push(`✓ ${consCount} consommables créés`)

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg, ok: false }, { status: 500 })
  }
}
