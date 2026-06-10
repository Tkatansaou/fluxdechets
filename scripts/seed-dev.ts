// WasteFlow — seed de développement
// Usage : pnpm seed  (requires DATABASE_URL + DIRECT_URL in .env.local)

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding WasteFlow dev database…')

  // ─── Admin user + org ──────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('wasteflow2026', 12)

  const user = await prisma.user.upsert({
    where: { email: 'kofi.mensah@stadd-gip.tg' },
    update: {},
    create: {
      email: 'kofi.mensah@stadd-gip.tg',
      passwordHash,
      name: 'Kofi Mensah',
      emailVerifiedAt: new Date(),
      role: 'ADMIN',
    },
  })
  console.log(`✓ User: ${user.email}`)

  const org = await prisma.organization.upsert({
    where: { slug: 'stadd-gip-togo' },
    update: {},
    create: {
      slug: 'stadd-gip-togo',
      name: 'STADD-GIP-Togo',
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  })
  console.log(`✓ Org: ${org.name}`)

  await prisma.delegataireProfil.upsert({
    where: { orgId: org.id },
    update: {},
    create: {
      orgId: org.id,
      telephone: '+22890000001',
      adresse: 'Quartier Administratif, Vogan',
      commune: 'Commune de Vo1 (Vogan)',
      numContrat: 'DSP-VO1-2024-001',
      dateContrat: new Date('2024-01-15'),
      objectifAbonnes: 900,
      objectifRecouvrement: 80,
      objectifCollecte: 99,
    },
  })
  console.log('✓ DelegataireProfil')

  // ─── Agent de recouvrement ─────────────────────────────────────────────────
  const agent = await prisma.user.upsert({
    where: { email: 'ama.sodji@stadd-gip.tg' },
    update: {},
    create: {
      email: 'ama.sodji@stadd-gip.tg',
      passwordHash: await bcrypt.hash('wasteflow2026', 12),
      name: 'Ama Sodji',
      emailVerifiedAt: new Date(),
    },
  })
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: agent.id } },
    update: {},
    create: { organizationId: org.id, userId: agent.id, role: 'RECOUVREMENT' },
  })

  // ─── Chauffeurs ────────────────────────────────────────────────────────────
  const komi = await prisma.user.upsert({
    where: { email: 'komi.agbeko@stadd-gip.tg' },
    update: {},
    create: { email: 'komi.agbeko@stadd-gip.tg', passwordHash, name: 'Komi Agbeko', emailVerifiedAt: new Date() },
  })
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: komi.id } },
    update: {},
    create: { organizationId: org.id, userId: komi.id, role: 'CHAUFFEUR' },
  })
  const sena = await prisma.user.upsert({
    where: { email: 'sena.dossou@stadd-gip.tg' },
    update: {},
    create: { email: 'sena.dossou@stadd-gip.tg', passwordHash, name: 'Sena Dossou', emailVerifiedAt: new Date() },
  })
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: sena.id } },
    update: {},
    create: { organizationId: org.id, userId: sena.id, role: 'CHAUFFEUR' },
  })
  console.log('✓ Team (agent + 2 chauffeurs)')

  // ─── Zones ─────────────────────────────────────────────────────────────────
  const zones = await Promise.all([
    prisma.zone.upsert({
      where: { id: 'zone-seed-1' },
      update: {},
      create: { id: 'zone-seed-1', orgId: org.id, nom: 'Vogan-Centre', description: 'Centre-ville et quartier admin', frequenceCollecte: 'bi-hebdomadaire' },
    }),
    prisma.zone.upsert({
      where: { id: 'zone-seed-2' },
      update: {},
      create: { id: 'zone-seed-2', orgId: org.id, nom: 'Quartier Marché', description: 'Grand marché et environs', frequenceCollecte: 'bi-hebdomadaire' },
    }),
    prisma.zone.upsert({
      where: { id: 'zone-seed-3' },
      update: {},
      create: { id: 'zone-seed-3', orgId: org.id, nom: 'Quartier Nord', description: 'Extension nord de Vogan', frequenceCollecte: 'hebdomadaire' },
    }),
  ])
  console.log(`✓ ${zones.length} zones`)

  // ─── Engins ────────────────────────────────────────────────────────────────
  const engins = await Promise.all([
    prisma.engin.upsert({
      where: { id: 'eng-seed-1' },
      update: {},
      create: { id: 'eng-seed-1', orgId: org.id, immatriculation: 'TRI-001', type: 'tricycle', marque: 'Yamaha', modele: 'Alpha 110', annee: 2022, statut: 'opérationnel', kilometrage: 12450, dateAcquisition: new Date('2022-03-15') },
    }),
    prisma.engin.upsert({
      where: { id: 'eng-seed-2' },
      update: {},
      create: { id: 'eng-seed-2', orgId: org.id, immatriculation: 'TRI-002', type: 'tricycle', marque: 'Honda', modele: 'Cargo 125', annee: 2021, statut: 'en-panne', kilometrage: 8730, dateAcquisition: new Date('2021-06-20') },
    }),
    prisma.engin.upsert({
      where: { id: 'eng-seed-3' },
      update: {},
      create: { id: 'eng-seed-3', orgId: org.id, immatriculation: 'CAM-001', type: 'camion-benne', marque: 'Isuzu', modele: 'NPR 75L', annee: 2020, statut: 'opérationnel', kilometrage: 45200, dateAcquisition: new Date('2020-09-01') },
    }),
  ])
  console.log(`✓ ${engins.length} engins`)

  // Add panne on TRI-002
  await prisma.panneEngin.upsert({
    where: { id: 'panne-seed-1' },
    update: {},
    create: { id: 'panne-seed-1', enginId: 'eng-seed-2', description: 'Moteur surchauffe, fumée noire — piston grippé suspecté', date: new Date('2026-06-04'), statut: 'ouverte' },
  })

  // ─── Abonnés ───────────────────────────────────────────────────────────────
  const abonnesData = [
    // Vogan-Centre
    { id: 'ab-s-01', zoneId: 'zone-seed-1', nom: 'Mensah', prenom: 'Koffi', telephone: '+22891234567', adresse: 'Rue de la Paix N°12', statut: 'à-jour' },
    { id: 'ab-s-02', zoneId: 'zone-seed-1', nom: 'Agbeko', prenom: 'Afi', telephone: '+22892345678', adresse: 'Av. de l\'Indépendance', statut: 'à-jour' },
    { id: 'ab-s-03', zoneId: 'zone-seed-1', nom: 'Dossou', prenom: 'Yawa', telephone: '+22893456789', adresse: 'Quartier Admin', statut: 'à-jour' },
    { id: 'ab-s-04', zoneId: 'zone-seed-1', nom: 'Teteh', prenom: 'Kokou', telephone: '+22890123456', adresse: 'Ruelle église catholique', statut: 'à-jour' },
    { id: 'ab-s-05', zoneId: 'zone-seed-1', nom: 'Komla', prenom: 'Akosua', telephone: '+22891357924', adresse: 'Cité admin B12', statut: 'à-jour' },
    { id: 'ab-s-06', zoneId: 'zone-seed-1', nom: 'Djossou', prenom: 'Abla', telephone: '+22892468135', adresse: 'Av. du Marché', statut: 'en-retard' },
    { id: 'ab-s-07', zoneId: 'zone-seed-1', nom: 'Tsevi', prenom: 'Kodjo', telephone: '+22890987654', adresse: 'Rue de la Mairie N°5', statut: 'impayé' },
    // Marché
    { id: 'ab-s-08', zoneId: 'zone-seed-2', nom: 'Djakou', prenom: 'Enyonam', telephone: '+22890111222', adresse: 'Marché central, lot 4B', statut: 'à-jour' },
    { id: 'ab-s-09', zoneId: 'zone-seed-2', nom: 'Hounkpe', prenom: 'Selom', telephone: '+22891222333', adresse: 'Derrière marché alimentaire', statut: 'à-jour' },
    { id: 'ab-s-10', zoneId: 'zone-seed-2', nom: 'Amedome', prenom: 'Brigitte', telephone: '+22892333444', adresse: 'Rue Komlan Gakpe N°8', statut: 'à-jour' },
    { id: 'ab-s-11', zoneId: 'zone-seed-2', nom: 'Attiogbe', prenom: 'Marcel', telephone: '+22893444555', adresse: 'Côté pharmacie centrale', statut: 'en-retard' },
    { id: 'ab-s-12', zoneId: 'zone-seed-2', nom: 'Lawson', prenom: 'Precious', telephone: '+22893888999', adresse: 'Lotissement Marché N°22', statut: 'impayé' },
    // Nord
    { id: 'ab-s-13', zoneId: 'zone-seed-3', nom: 'Agbavitor', prenom: 'Essi', telephone: '+22890101010', adresse: 'Quartier Nord, rue TOGBUI', statut: 'à-jour' },
    { id: 'ab-s-14', zoneId: 'zone-seed-3', nom: 'Avlessi', prenom: 'Komlan', telephone: '+22891212121', adresse: 'Extension nord, lot 18', statut: 'à-jour' },
    { id: 'ab-s-15', zoneId: 'zone-seed-3', nom: 'Vodounou', prenom: 'Samuel', telephone: '+22893434343', adresse: 'Carrefour nord, école', statut: 'impayé' },
  ]

  for (const ab of abonnesData) {
    await prisma.abonne.upsert({
      where: { id: ab.id },
      update: {},
      create: {
        id: ab.id,
        zoneId: ab.zoneId,
        nom: ab.nom,
        prenom: ab.prenom,
        telephone: ab.telephone,
        adresse: ab.adresse,
        statut: ab.statut,
        actif: true,
        dateInscription: new Date('2024-02-01'),
      },
    })
  }
  console.log(`✓ ${abonnesData.length} abonnés`)

  // ─── Paiements (mai 2026) ──────────────────────────────────────────────────
  const aJourIds = abonnesData.filter(a => a.statut === 'à-jour').map(a => a.id)
  const mois = '2026-05'
  for (let i = 0; i < aJourIds.length; i++) {
    const abId = aJourIds[i]!
    await prisma.paiement.upsert({
      where: { reference: `WF-SEED-${mois}-${i}` },
      update: {},
      create: {
        abonneId: abId,
        agentId: agent.id,
        montant: 1000,
        moyen: i % 3 === 0 ? 'mobile-money' : 'espèces',
        operateur: i % 3 === 0 ? (i % 6 === 0 ? 'tmoney' : 'flooz') : undefined,
        statut: 'validé',
        reference: `WF-SEED-${mois}-${i}`,
        moisConcerne: mois,
        date: new Date(`2026-05-0${(i % 9) + 1}`),
      },
    })
  }
  console.log(`✓ ${aJourIds.length} paiements (mai 2026)`)

  // ─── Consommables ──────────────────────────────────────────────────────────
  const consomData = [
    { id: 'cons-s-1', nom: 'Gazole (carburant)', categorie: 'carburant', unite: 'litres', stockActuel: 45, seuilAlerte: 50, prixUnitaire: 700 },
    { id: 'cons-s-2', nom: 'Gants de protection', categorie: 'epi', unite: 'paires', stockActuel: 12, seuilAlerte: 20, prixUnitaire: 800 },
    { id: 'cons-s-3', nom: 'Sacs poubelle 50L', categorie: 'sacs-poubelle', unite: 'sacs', stockActuel: 340, seuilAlerte: 100, prixUnitaire: 150 },
    { id: 'cons-s-4', nom: 'Huile moteur 20W50', categorie: 'pieces-detachees', unite: 'litres', stockActuel: 3, seuilAlerte: 5, prixUnitaire: 2500 },
  ]
  for (const c of consomData) {
    await prisma.consommable.upsert({
      where: { id: c.id },
      update: {},
      create: { orgId: org.id, ...c },
    })
  }
  console.log(`✓ ${consomData.length} consommables`)

  // ─── Tournée exemple ──────────────────────────────────────────────────────
  await prisma.tournee.upsert({
    where: { id: 'tour-seed-1' },
    update: {},
    create: {
      id: 'tour-seed-1',
      zoneId: 'zone-seed-1',
      enginId: 'eng-seed-1',
      chauffeurId: komi.id,
      date: new Date('2026-06-02'),
      statut: 'terminée',
    },
  })
  console.log('✓ Tournée exemple')

  console.log('\n✅ Seed terminé.')
  console.log('──────────────────────────────────────')
  console.log('Connexion : kofi.mensah@stadd-gip.tg')
  console.log('Mot de passe : wasteflow2026')
  console.log('──────────────────────────────────────')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
