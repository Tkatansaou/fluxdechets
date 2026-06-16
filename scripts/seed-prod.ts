// WasteFlow — Seed production pour l'org existant (mouservice / katantchaa@gmail.com)
// Usage : pnpm seed-prod  (requires DATABASE_URL + DIRECT_URL in .env.local)
// $ npm run seed-prod

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed production WasteFlow…')

  const SUPERADMIN_EMAIL = 'katantchaa@gmail.com'

  // ─── Récupérer l'org et le user existants ────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
    include: { ownedOrgs: { take: 1 } },
  })
  if (!user || !user.ownedOrgs.length) {
    console.error(`❌ User ${SUPERADMIN_EMAIL} introuvable ou sans org. Passez d'abord par /api/setup.`)
    process.exit(1)
  }

  const org = user.ownedOrgs[0]!
  const orgId = org.id
  console.log(`✓ Org: ${org.name} (${orgId})`)

  // Créer le DelegataireProfil s'il n'existe pas
  const profil = await prisma.delegataireProfil.upsert({
    where: { orgId },
    update: {},
    create: {
      orgId,
      commune: 'Lomé',
      region: 'Maritime',
      numContrat: 'DSP-LOME-2026-001',
      dateContrat: new Date('2026-01-01'),
      objectifAbonnes: 900,
      objectifRecouvrement: 80,
      objectifCollecte: 99,
    },
  })
  console.log('✓ DelegataireProfil')

  // ─── Zones ──────────────────────────────────────────────────────────────
  const zonesData = [
    { nom: 'Tokoin', description: 'Quartier Tokoin — résidentiel et commerces', frequence: 'bi-hebdomadaire' },
    { nom: 'Tokoin-Ouest', description: 'Extension ouest de Tokoin', frequence: 'bi-hebdomadaire' },
    { nom: 'Bè', description: 'Quartier Bè — centre-ville historique', frequence: 'bi-hebdomadaire' },
    { nom: 'Doumasséssé', description: 'Zone industrielle et périphérique', frequence: 'hebdomadaire' },
  ]

  const zoneMap: Record<string, string> = {}
  for (const z of zonesData) {
    const existing = await prisma.zone.findFirst({ where: { orgId, nom: z.nom } })
    if (existing) {
      zoneMap[z.nom] = existing.id
    } else {
      const created = await prisma.zone.create({
        data: { orgId, nom: z.nom, description: z.description, frequenceCollecte: z.frequence },
      })
      zoneMap[z.nom] = created.id
    }
  }
  console.log(`✓ ${Object.keys(zoneMap).length} zones`)

  // ─── Abonnés ────────────────────────────────────────────────────────────
  const abonnesData = [
    { zone: 'Tokoin', nom: 'Mensah', prenom: 'Koffi', tel: '+22890123456', adresse: 'Rue de la Paix N°12', statut: 'impayé' },
    { zone: 'Tokoin', nom: 'Sodji', prenom: 'Afi', tel: '+22891234567', adresse: 'Av. de l\'Indépendance', statut: 'à-jour' },
    { zone: 'Tokoin', nom: 'Dossou', prenom: 'Yawa', tel: '+22892345678', adresse: 'Quartier Admin', statut: 'à-jour' },
    { zone: 'Tokoin-Ouest', nom: 'Agbeko', prenom: 'Kokou', tel: '+22893456789', adresse: 'Ruelle église', statut: 'à-jour' },
    { zone: 'Tokoin-Ouest', nom: 'Komlan', prenom: 'Akosua', tel: '+22894567890', adresse: 'Cité B12', statut: 'en-retard' },
    { zone: 'Tokoin-Ouest', nom: 'Teteh', prenom: 'Abla', tel: '+22895678901', adresse: 'Av. du Marché', statut: 'impayé' },
    { zone: 'Bè', nom: 'Hounkpe', prenom: 'Enyonam', tel: '+22896789012', adresse: 'Marché central, lot 4B', statut: 'à-jour' },
    { zone: 'Bè', nom: 'Djakou', prenom: 'Selom', tel: '+22897890123', adresse: 'Derrière marché', statut: 'à-jour' },
    { zone: 'Bè', nom: 'Attiogbe', prenom: 'Marcel', tel: '+22898901234', adresse: 'Rue Komlan N°8', statut: 'à-jour' },
    { zone: 'Doumasséssé', nom: 'Lawson', prenom: 'Precious', tel: '+22899012345', adresse: 'Zone industrielle', statut: 'à-jour' },
    { zone: 'Doumasséssé', nom: 'Vodounou', prenom: 'Samuel', tel: '+22890123457', adresse: 'Carrefour nord', statut: 'impayé' },
    { zone: 'Doumasséssé', nom: 'Avlessi', prenom: 'Komlan', tel: '+22891234568', adresse: 'Lot 18, extension', statut: 'en-retard' },
  ]

  let abCount = 0
  const aJourIds: string[] = []
  const zoneIdMap: Record<string, string> = {}
  for (const z of zonesData) zoneIdMap[z.nom] = zoneMap[z.nom]!

  for (const ab of abonnesData) {
    const zoneId = zoneIdMap[ab.zone]
    if (!zoneId) continue

    const existing = await prisma.abonne.findFirst({
      where: { zoneId, telephone: ab.tel },
    })
    if (existing) {
      if (existing.statut === 'à-jour' || existing.statut === 'en-retard') aJourIds.push(existing.id)
      continue
    }

    const created = await prisma.abonne.create({
      data: {
        zoneId,
        nom: ab.nom,
        prenom: ab.prenom,
        telephone: ab.tel,
        adresse: ab.adresse,
        statut: ab.statut,
        actif: true,
        dateInscription: new Date('2025-06-01'),
      },
    })
    abCount++
    if (ab.statut === 'à-jour' || ab.statut === 'en-retard') aJourIds.push(created.id)
  }
  console.log(`✓ ${abCount} abonnés créés, ${aJourIds.length} à jour`)

  // ─── Engins ─────────────────────────────────────────────────────────────
  const enginsData = [
    { immat: 'TRI-001', type: 'tricycle', marque: 'Yamaha', statut: 'opérationnel', km: 12450 },
    { immat: 'TRI-002', type: 'tricycle', marque: 'Honda', statut: 'en-panne', km: 8730 },
    { immat: 'CAM-001', type: 'camion-benne', marque: 'Isuzu', statut: 'opérationnel', km: 45200 },
    { immat: 'CHA-001', type: 'charrette', marque: 'Locale', statut: 'opérationnel', km: 3200 },
  ]

  let engCount = 0
  for (const e of enginsData) {
    const existing = await prisma.engin.findFirst({
      where: { orgId, immatriculation: e.immat },
    })
    if (existing) continue
    await prisma.engin.create({
      data: {
        orgId,
        immatriculation: e.immat,
        type: e.type,
        marque: e.marque,
        modele: e.type === 'tricycle' ? 'Alpha 110' : e.type === 'camion-benne' ? 'NPR 75L' : 'Standard',
        annee: 2022,
        statut: e.statut,
        kilometrage: e.km,
        dateAcquisition: new Date('2022-03-15'),
      },
    })
    engCount++
  }
  console.log(`✓ ${engCount} engins créés`)

  // ─── Paiements (juin 2026) ──────────────────────────────────────────────
  const mois = '2026-06'
  let paiementCount = 0
  for (let i = 0; i < aJourIds.length; i++) {
    const abId = aJourIds[i]!
    const ref = `WF-PROD-${mois}-${i}`
    const existing = await prisma.paiement.findUnique({ where: { reference: ref } })
    if (existing) continue

    await prisma.paiement.create({
      data: {
        abonneId: abId,
        agentId: user.id,
        montant: 1000,
        moyen: i % 3 === 0 ? 'mobile-money' : 'espèces',
        operateur: i % 3 === 0 ? (i % 6 === 0 ? 'tmoney' : 'flooz') : undefined,
        statut: 'validé',
        reference: ref,
        moisConcerne: mois,
        date: new Date(`2026-06-0${(i % 9) + 1}`),
      },
    })
    paiementCount++

    // Mettre à jour le statut de l'abonné
    await prisma.abonne.update({ where: { id: abId }, data: { statut: 'à-jour' } })
  }
  console.log(`✓ ${paiementCount} paiements (juin 2026)`)

  // ─── Consommables ───────────────────────────────────────────────────────
  const consomData = [
    { nom: 'Gazole (carburant)', categorie: 'carburant', unite: 'litres', stock: 45, seuil: 50, prix: 700 },
    { nom: 'Gants de protection', categorie: 'epi', unite: 'paires', stock: 12, seuil: 20, prix: 800 },
    { nom: 'Sacs poubelle 50L', categorie: 'sacs-poubelle', unite: 'sacs', stock: 340, seuil: 100, prix: 150 },
    { nom: 'Huile moteur 20W50', categorie: 'pieces-detachees', unite: 'litres', stock: 3, seuil: 5, prix: 2500 },
  ]

  let consCount = 0
  for (const c of consomData) {
    const existing = await prisma.consommable.findFirst({
      where: { orgId, nom: c.nom },
    })
    if (existing) continue
    await prisma.consommable.create({
      data: {
        orgId,
        nom: c.nom,
        categorie: c.categorie,
        unite: c.unite,
        stockActuel: c.stock,
        seuilAlerte: c.seuil,
        prixUnitaire: c.prix,
      },
    })
    consCount++
  }
  console.log(`✓ ${consCount} consommables créés`)

  console.log('\n✅ Seed production terminé.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
