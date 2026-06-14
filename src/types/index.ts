// Types partagés pour toute l'application
// Évite la duplication d'interfaces dans les pages

// ===== ZONES =====
export interface Zone {
  id: string
  nom: string
}

// ===== ABONNÉS =====
export interface Abonne {
  id: string
  nom: string
  prenom: string
  telephone: string
  adresse: string | null
  zoneId: string
  zone?: { id: string; nom: string }
  statut: string
  frequenceCollecte: string
  dateInscription?: string
  actif?: boolean
  lienPaiementToken?: string
  createdAt?: string
  paiements?: Paiement[]
  marquages?: Marquage[]
}

export interface Paiement {
  id: string
  montant: number
  moyen: string
  operateur: string | null
  statut: string
  reference: string
  moisConcerne: string
  date: string
}

export interface Marquage {
  id: string
  statut: string
  motif: string | null
  heureMarquage: string | null
  createdAt: string
  tournee?: { date: string }
}

// ===== COMMUNE =====
export interface Profil {
  commune: string
  telephone: string | null
  adresse: string | null
  region: string | null
  numContrat: string | null
  dateContrat: string | null
  objectifAbonnes: number
  objectifRecouvrement: number
  objectifCollecte: number
}

export interface Kpis {
  abonnesActifs: number
  montantMoisCourant: number
  tauxRecouvrement: number
  tauxCollecte: number
  tourneesTotal: number
  tourneesTerminees: number
}

export interface TourneeRecente {
  id: string
  date: string
  statut: string
  zone: { nom: string }
}

// ===== CONSOMMABLES =====
export interface Consommable {
  id: string
  nom: string
  categorie: string
  unite: string
  stockActuel: number
  seuilAlerte: number
  prixUnitaire: number
}

export interface Mouvement {
  id: string
  type: string
  quantite: number
  date: string
  motif: string | null
  createdAt: string
  consommable: {
    id: string
    nom: string
    unite: string
  }
}

// ===== ENGINS =====
export interface Engin {
  id: string
  immatriculation: string
  type: string
  marque: string | null
  modele: string | null
  annee: number | null
  statut: string
  kilometrage: number
  dateAcquisition: string | null
  maintenances?: Maintenance[]
  carburants?: Carburant[]
  pannes?: Panne[]
}

export interface Maintenance {
  id: string
  type: string
  description: string | null
  cout: number
  date: string
  prestataire: string | null
  kilometrageLors: number | null
}

export interface Carburant {
  id: string
  litres: number
  cout: number
  kilometrage: number
  date: string
}

export interface Panne {
  id: string
  description: string
  date: string
  statut: string
  coutReparation: number | null
  dateResolution: string | null
}

// ===== SCRAPING =====
export interface ScrapingStatus {
  configured: boolean
  availableTypes: string[]
}

export interface Prospect {
  nom: string
  telephone: string | null
  adresse: string | null
  source: string
}

export interface AbonnesResult {
  total: number
  abonnes: Prospect[]
}

export interface GoogleSearchResult {
  title: string
  url: string
  snippet: string
}

// ===== STATUTS =====
export const STATUT_ENGIN: Record<string, { label: string; cls: string }> = {
  'opérationnel': { label: 'Opérationnel', cls: 'bg-emerald-100 text-emerald-700' },
  'en-panne': { label: 'En panne', cls: 'bg-red-100 text-red-700' },
  'en-maintenance': { label: 'Maintenance', cls: 'bg-amber-100 text-amber-700' },
}

export const STATUT_TOURNEE: Record<string, { label: string; cls: string }> = {
  planifiée: { label: 'Planifiée', cls: 'bg-gray-100 text-gray-600' },
  'en-cours': { label: 'En cours', cls: 'bg-blue-100 text-blue-700' },
  terminée: { label: 'Terminée', cls: 'bg-emerald-100 text-emerald-700' },
  annulée: { label: 'Annulée', cls: 'bg-red-100 text-red-700' },
}