/**
 * Types partagés des réponses API (Prisma camelCase).
 * Évite les redéfinitions locales dans chaque page.
 */

export interface ZoneLite {
  id: string
  nom: string
}

export interface ZoneWithCount extends ZoneLite {
  description: string | null
  frequenceCollecte: string
  _count: { abonnes: number }
}

export interface AbonneLite {
  id: string
  nom: string
  prenom: string
  telephone: string
  adresse: string | null
  zoneId: string
  zone: ZoneLite
  statut: string
  frequenceCollecte: string
  lienPaiementToken: string
  createdAt: string
}

export interface PaiementLite {
  id: string
  montant: number
  moyen: string
  operateur: string | null
  statut: string
  reference: string
  moisConcerne: string
  date: string
}

export interface EnginLite {
  id: string
  immatriculation: string
  type: string
  statut: string
  marque: string | null
  modele: string | null
  annee: number | null
  kilometrage: number
  dateAcquisition: string | null
  createdAt: string
}

export interface TourneeLite {
  id: string
  date: string
  statut: string
  notes: string | null
  zone: ZoneLite
  engin: { immatriculation: string; type: string }
  chauffeur: { name: string | null; email: string }
  _count: { marquages: number }
}

export interface MembreLite {
  id: string
  role: string
  user: { id: string; name: string | null; email: string }
}

export interface ConsommableLite {
  id: string
  nom: string
  categorie: string
  unite: string
  stockActuel: number
  seuilAlerte: number
  prixUnitaire: number
}

export interface EmployeLite {
  id: string
  nom: string
  prenom: string
  telephone: string
  email?: string | null
  poste: string
  statut: string
  dateEmbauche?: string | null
  salaire?: number | null
  notes?: string | null
  zone?: ZoneLite | null
}
