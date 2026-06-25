export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/server/prisma'
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Route de seed désactivée en production' }, { status: 403 })
  }

  const seedKey = req.headers.get('x-seed-key')
  if (process.env.CRON_SECRET && (!seedKey || seedKey !== process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    // Migration automatique: ajouter la colonne pays si elle n'existe pas
    await prisma.$executeRawUnsafe(`ALTER TABLE "DelegataireProfil" ADD COLUMN IF NOT EXISTS "pays" TEXT NOT NULL DEFAULT 'Togo'`)
    const email = process.env.SUPERADMIN_EMAIL ?? 'katantchaa@gmail.com'
    const user = await prisma.user.findUnique({ where: { email }, include: { ownedOrgs: { take: 1, include: { deleProf: true } }, memberships: { take: 1, include: { organization: { include: { deleProf: true } } } } } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 400 })
    const ownedOrg = user.ownedOrgs[0]; const membershipOrg = user.memberships[0]?.organization; const org = ownedOrg ?? membershipOrg
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 400 })
    const orgId = org.id; const results: string[] = []
    const DELEGATAIRE_COMMUNE = process.env.DELEGATAIRE_COMMUNE ?? 'Lomé'
    const villes: Record<string, { region: string; titre: string; pays: string; ab: number }> = {
      Lomé: { region: 'Maritime', titre: 'Lomé', pays: 'Togo', ab: 50000 },
      Cotonou: { region: 'Littoral', titre: 'Cotonou', pays: 'Bénin', ab: 40000 },
      Abidjan: { region: 'Abidjan', titre: "District d'Abidjan", pays: "Côte d'Ivoire", ab: 120000 },
      Ouagadougou: { region: 'Centre', titre: 'Ouagadougou', pays: 'Burkina Faso', ab: 60000 },
      Dakar: { region: 'Dakar', titre: 'Dakar', pays: 'Sénégal', ab: 70000 },
      Bamako: { region: 'Bamako', titre: 'District de Bamako', pays: 'Mali', ab: 50000 },
      Niamey: { region: 'Niamey', titre: 'C.U. de Niamey', pays: 'Niger', ab: 30000 },
    }
    const v = villes[DELEGATAIRE_COMMUNE] ?? villes.Lomé!
    await prisma.$executeRawUnsafe(`ALTER TABLE "DelegataireProfil" ADD COLUMN IF NOT EXISTS "pays" TEXT NOT NULL DEFAULT 'Togo'`)
    await prisma.delegataireProfil.upsert({
      where: { orgId },
      update: { commune: DELEGATAIRE_COMMUNE, region: v.region, pays: v.pays, objectifAbonnes: v.ab },
      create: { orgId, pays: v.pays, commune: DELEGATAIRE_COMMUNE, region: v.region, numContrat: `DSP-${DELEGATAIRE_COMMUNE}-2026-001`, dateContrat: new Date('2026-01-01'), objectifAbonnes: v.ab, objectifRecouvrement: 85, objectifCollecte: 98 },
    })
    results.push(`✓ ${v.pays} / ${v.titre}`)
    const qs: Record<string, Array<{ n: string; d: string; f: string }>> = {
      'Lomé': [{ n: 'Tokoin', d: 'Tokoin — résidentiel et commerces', f: 'bi-hebdomadaire' }, { n: 'Bè', d: 'Bè — centre-ville historique', f: 'bi-hebdomadaire' }, { n: 'Doumasséssé', d: 'Doumasséssé — zone industrielle', f: 'hebdomadaire' }, { n: 'Kodjoviakopé', d: 'Kodjoviakopé — résidentiel haut-standing', f: 'bi-hebdomadaire' }, { n: 'Adidogomé', d: 'Adidogomé — populaire, marchés', f: 'bi-hebdomadaire' }, { n: 'Amoutivé', d: 'Amoutivé — artisanal et commerçant', f: 'bi-hebdomadaire' }],
      'Cotonou': [{ n: 'Dantokpa', d: 'Dantokpa — grand marché', f: 'bi-hebdomadaire' }, { n: 'Cadjehoun', d: 'Cadjehoun — résidentiel, ambassades', f: 'bi-hebdomadaire' }, { n: 'Akpakpa', d: 'Akpakpa — zone industrielle', f: 'hebdomadaire' }, { n: 'Ganhi', d: 'Ganhi — centre administratif', f: 'bi-hebdomadaire' }, { n: 'Zongo', d: 'Zongo — quartier populaire', f: 'bi-hebdomadaire' }],
      'Abidjan': [{ n: 'Cocody', d: 'Cocody — résidentiel diplomatique', f: 'bi-hebdomadaire' }, { n: 'Treichville', d: 'Treichville — commercial et portuaire', f: 'bi-hebdomadaire' }, { n: 'Yopougon', d: 'Yopougon — grand quartier populaire', f: 'hebdomadaire' }, { n: 'Adjamé', d: 'Adjamé — grand marché commercial', f: 'bi-hebdomadaire' }, { n: 'Marcory', d: 'Marcory — affaires et résidentiel', f: 'bi-hebdomadaire' }],
      'Ouagadougou': [{ n: 'Ouaga 2000', d: 'Ouaga 2000 — administratif et diplomatique', f: 'bi-hebdomadaire' }, { n: "Patte d'Oie", d: "Patte d'Oie — résidentiel et commerces", f: 'bi-hebdomadaire' }, { n: 'Zogona', d: 'Zogona — quartier populaire', f: 'bi-hebdomadaire' }, { n: 'Tampouy', d: 'Tampouy — zone périurbaine', f: 'hebdomadaire' }],
      'Dakar': [{ n: 'Plateau', d: 'Plateau — centre des affaires', f: 'bi-hebdomadaire' }, { n: 'Médina', d: 'Médina — historique et populaire', f: 'bi-hebdomadaire' }, { n: 'Yoff', d: 'Yoff — résidentiel et aéroportuaire', f: 'bi-hebdomadaire' }, { n: 'Pikine', d: 'Pikine — grande banlieue', f: 'hebdomadaire' }, { n: 'Ouakam', d: 'Ouakam — résidentiel et universitaire', f: 'bi-hebdomadaire' }],
      'Bamako': [{ n: 'Hamdallaye', d: 'Hamdallaye — centre administratif', f: 'bi-hebdomadaire' }, { n: 'Badalabougou', d: 'Badalabougou — résidentiel', f: 'bi-hebdomadaire' }, { n: 'Sogoninko', d: 'Sogoninko — résidentiel et commerces', f: 'bi-hebdomadaire' }, { n: 'Niamakoro', d: 'Niamakoro — grand quartier', f: 'hebdomadaire' }],
      'Niamey': [{ n: 'Plateau', d: 'Plateau — centre-ville administratif', f: 'bi-hebdomadaire' }, { n: 'Lamordé', d: 'Lamordé — résidentiel', f: 'bi-hebdomadaire' }, { n: 'Niamey 2000', d: 'Niamey 2000 — zone en développement', f: 'bi-hebdomadaire' }, { n: 'Banifandou', d: 'Banifandou — périphérique', f: 'hebdomadaire' }],
    }
    const quartiers = qs[DELEGATAIRE_COMMUNE] ?? qs.Lomé!
    const zm: Record<string, string> = {}
    for (const q of quartiers) {
      const ex = await prisma.zone.findFirst({ where: { orgId, nom: q.n } })
      if (ex) { zm[q.n] = ex.id; continue }
      const c = await prisma.zone.create({ data: { orgId, nom: q.n, description: q.d, frequenceCollecte: q.f } }); zm[q.n] = c.id
    }
    results.push(`✓ ${Object.keys(zm).length} quartiers`)
    const ph = await bcrypt.hash('wasteflow2026', 12)
    const emps = [
      { n: 'Komi Agbeko', e: `komi.agbeko@${org.slug}.tg`, r: 'chauffeur', t: '+228****0001' },
      { n: 'Afi Mensah', e: `afi.mensah@${org.slug}.tg`, r: 'agent-collecte', t: '+228****0002' },
      { n: 'Kokou Dossou', e: `kokou.dossou@${org.slug}.tg`, r: 'agent-collecte', t: '+228****0003' },
      { n: 'Yawa Sodji', e: `yawa.sodji@${org.slug}.tg`, r: 'agent-recouvrement', t: '+228****0004' },
      { n: 'Marcel Attiogbe', e: `marcel.attiogbe@${org.slug}.tg`, r: 'chauffeur', t: '+228****0005' },
      { n: 'Enyonam Hounkpe', e: `enyonam.hounkpe@${org.slug}.tg`, r: 'agent-collecte', t: '+228****0006' },
    ]
    const cIds: string[] = []
    for (const emp of emps) {
      const ex = await prisma.user.findUnique({ where: { email: emp.e } })
      if (ex) { if (emp.r === 'chauffeur') cIds.push(ex.id); continue }
      const u = await prisma.user.create({ data: { email: emp.e, name: emp.n, passwordHash: ph, role: 'MEMBER', emailVerifiedAt: new Date(), memberships: { create: { organizationId: orgId, role: emp.r === 'chauffeur' ? 'CHAUFFEUR' : 'MEMBER' } } } })
      await prisma.employe.create({ data: { orgId, nom: emp.n.split(' ')[1] ?? emp.n, prenom: emp.n.split(' ')[0] ?? '', email: emp.e, poste: emp.r, telephone: emp.t, dateEmbauche: new Date('2024-01-15'), statut: 'actif', salaire: emp.r === 'chauffeur' ? 120000 : 80000 } })
      if (emp.r === 'chauffeur') cIds.push(u.id)
    }
    results.push(`✓ ${emps.length} employés (${cIds.length} chauffeurs)`)
    const engs = [
      { im: 'TRI-001', t: 'tricycle', m: 'Yamaha', mo: 'Alpha 110', a: 2023, km: 12500, s: 'opérationnel' as const },
      { im: 'TRI-002', t: 'tricycle', m: 'Bajaj', mo: 'Maxima Z', a: 2024, km: 5800, s: 'opérationnel' as const },
      { im: 'TRI-003', t: 'tricycle', m: 'TVS', mo: 'King XP', a: 2022, km: 18900, s: 'en-panne' as const },
      { im: 'CAM-001', t: 'camion-benne', m: 'Isuzu', mo: 'NPR 75L', a: 2021, km: 45200, s: 'opérationnel' as const },
      { im: 'CAM-002', t: 'camion-benne', m: 'Mercedes', mo: 'Atego 815', a: 2023, km: 15200, s: 'opérationnel' as const },
    ]
    const eIds: string[] = []
    for (const e of engs) {
      const ex = await prisma.engin.findFirst({ where: { orgId, immatriculation: e.im } })
      if (ex) { eIds.push(ex.id); continue }
      const c = await prisma.engin.create({ data: { orgId, immatriculation: e.im, type: e.t, marque: e.m, modele: e.mo, annee: e.a, statut: e.s, kilometrage: e.km, dateAcquisition: new Date(`${e.a}-03-15`) } }); eIds.push(c.id)
    }
    results.push(`✓ ${engs.length} engins`)
    const abs = [
      { z: 'Tokoin', n: 'Mensah', p: 'Koffi', t: '+228****1011', a: 'Rue de la Paix N°12' },
      { z: 'Tokoin', n: 'Sodji', p: 'Afi', t: '+228****1012', a: "Av. de l'Indépendance N°45" },
      { z: 'Tokoin', n: 'Dossou', p: 'Yawa', t: '+228****1013', a: 'Quartier Admin, lot 8' },
      { z: 'Tokoin', n: 'Agbemapko', p: 'Kokou', t: '+228****1014', a: 'Rue des écoles N°22' },
      { z: 'Bè', n: 'Hounkpe', p: 'Enyonam', t: '+228****2011', a: 'Marché central, lot 4B' },
      { z: 'Bè', n: 'Djakou', p: 'Selom', t: '+228****2012', a: 'Derrière marché, rue 3' },
      { z: 'Bè', n: 'Attiogbe', p: 'Marcel', t: '+228****2013', a: 'Rue Komlan N°8' },
      { z: 'Bè', n: 'Vidovi', p: 'Akossiwa', t: '+228****2014', a: 'Bè plage, lot 12' },
      { z: 'Doumasséssé', n: 'Lawson', p: 'Precious', t: '+228****3011', a: 'Zone industrielle, lot 7' },
      { z: 'Doumasséssé', n: 'Vodounou', p: 'Samuel', t: '+228****3012', a: 'Carrefour nord N°15' },
      { z: 'Doumasséssé', n: 'Avlessi', p: 'Komlan', t: '+228****3013', a: 'Lot 18, extension ouest' },
      { z: 'Kodjoviakopé', n: 'Amegashie', p: 'Edem', t: '+228****4011', a: 'Rue du Bénin N°25' },
      { z: 'Kodjoviakopé', n: 'Seshie', p: 'Mawuko', t: '+228****4012', a: "Av. de la Marina" },
      { z: 'Adidogomé', n: 'Togbedji', p: 'Kafui', t: '+228****5011', a: 'Marché Adido, rue 5' },
      { z: 'Adidogomé', n: 'Adzima', p: 'Mawuli', t: '+228****5012', a: 'Rue principale N°10' },
      { z: 'Amoutivé', n: 'Dovi', p: 'Amenyo', t: '+228****6011', a: 'Av. des artisans N°3' },
      { z: 'Amoutivé', n: 'Gblinkpon', p: 'Yawo', t: '+228****6012', a: 'Rue des forgerons' },
    ]
    const abIds: string[] = []
    for (const ab of abs) {
      const zid = zm[ab.z]; if (!zid) continue
      const ex = await prisma.abonne.findFirst({ where: { zoneId: zid, telephone: ab.t } })
      if (ex) { abIds.push(ex.id); continue }
      const c = await prisma.abonne.create({ data: { zoneId: zid, nom: ab.n, prenom: ab.p, telephone: ab.t, adresse: ab.a, statut: 'à-jour', actif: true, dateInscription: new Date('2025-01-15') } }); abIds.push(c.id)
    }
    results.push(`✓ ${abs.length} abonnés`)
    const mois = '2026-06'
    let pc = 0
    for (let i = 0; i < abIds.length; i++) {
      if (i % 4 === 0) continue
      const ref = `WF-${mois}-${i}`
      const ex = await prisma.paiement.findUnique({ where: { reference: ref } })
      if (ex) continue
      await prisma.paiement.create({ data: { abonneId: abIds[i]!, agentId: user.id, montant: 1000, moyen: i % 3 === 0 ? 'mobile-money' : 'espèces', operateur: i % 3 === 0 ? (i % 2 === 0 ? 'tmoney' : 'flooz') : undefined, statut: 'validé', reference: ref, moisConcerne: mois, date: new Date(`2026-06-${((i % 14) + 1).toString().padStart(2, '0')}`) } })
      pc++
    }
    results.push(`✓ ${pc} paiements (${mois})`)
    const now = new Date()
    const dow = now.getDay()
    const mon = new Date(now); mon.setDate(now.getDate() - ((dow + 6) % 7))
    let tc = 0
    for (let d = 0; d < 6; d++) {
      const dt = new Date(mon); dt.setDate(mon.getDate() + d)
      const z = Object.values(zm)[d % Object.keys(zm).length]!
      const en = eIds[d % eIds.length]!
      const ch = cIds[d % cIds.length] ?? user.id
      const ex = await prisma.tournee.findFirst({ where: { zoneId: z, date: dt } })
      if (ex) { tc++; continue }
      await prisma.tournee.create({ data: { zoneId: z, enginId: en, chauffeurId: ch, date: dt, statut: d < dow ? 'terminée' : (d === dow ? 'en-cours' : 'planifiée') } })
      tc++
    }
    results.push(`✓ ${tc} tournées cette semaine`)
    const cons = [
      { n: 'Gazole (carburant)', c: 'carburant', u: 'litres', s: 450, se: 100, p: 700 },
      { n: "Huile moteur 20W50", c: 'pieces-detachees', u: 'bidon 5L', s: 8, se: 3, p: 12500 },
      { n: 'Gants de protection', c: 'epi', u: 'paires', s: 50, se: 20, p: 800 },
      { n: 'Sacs poubelle 50L', c: 'sacs-poubelle', u: 'rouleau 50sacs', s: 30, se: 10, p: 2500 },
    ]
    let cc = 0
    for (const c of cons) { const ex = await prisma.consommable.findFirst({ where: { orgId, nom: c.n } }); if (ex) continue; await prisma.consommable.create({ data: { orgId, nom: c.n, categorie: c.c, unite: c.u, stockActuel: c.s, seuilAlerte: c.se, prixUnitaire: c.p } }); cc++ }
    results.push(`✓ ${cc} consommables`)
    return NextResponse.json({ ok: true, pays: v.pays, commune: DELEGATAIRE_COMMUNE, results })
  } catch (err) { const msg = err instanceof Error ? err.message : 'Erreur inconnue'; return NextResponse.json({ error: msg, ok: false }, { status: 500 }) }
}
