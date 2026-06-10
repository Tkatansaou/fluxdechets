export type UserRole = 'admin' | 'agent-recouvrement' | 'chauffeur' | 'commune'

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  role: UserRole
  zone_id?: string
  actif: boolean
  created_at: string
}

export type StatutAbonne = 'à-jour' | 'en-retard' | 'impayé' | 'inactif'
export type FrequenceCollecte = 'hebdomadaire' | 'bi-hebdomadaire'

export interface Abonne {
  id: string
  nom: string
  prenom: string
  telephone: string
  adresse: string
  zone_id: string
  statut: StatutAbonne
  frequence_collecte: FrequenceCollecte
  date_inscription: string
  actif: boolean
  lien_paiement_token: string
  created_at: string
}

export type MoyenPaiement = 'mobile-money' | 'espèces'
export type OperateurMM = 'tmoney' | 'flooz'
export type StatutPaiement = 'validé' | 'en-attente' | 'échoué'

export interface Paiement {
  id: string
  abonne_id: string
  montant: number
  moyen: MoyenPaiement
  operateur?: OperateurMM
  statut: StatutPaiement
  date: string
  agent_id?: string
  reference: string
  mois_concerne: string
  created_at: string
}

export type StatutTournee = 'planifiée' | 'en-cours' | 'terminée' | 'annulée'

export interface Tournee {
  id: string
  zone_id: string
  engin_id: string
  chauffeur_id: string
  date: string
  statut: StatutTournee
  notes?: string
  created_at: string
}

export type StatutMarquage = 'en-attente' | 'effectué' | 'non-effectué'
export type MotifNonEffectue = 'accès-bloqué' | 'bac-absent' | 'panne-engin' | 'autre'

export interface Marquage {
  id: string
  tournee_id: string
  abonne_id: string
  statut: StatutMarquage
  motif?: MotifNonEffectue
  motif_detail?: string
  heure_marquage?: string
  created_at: string
}

export type TypeEngin = 'tricycle' | 'camion-benne' | 'charrette'
export type StatutEngin = 'opérationnel' | 'en-panne' | 'en-maintenance'

export interface Engin {
  id: string
  immatriculation: string
  type: TypeEngin
  marque: string
  modele: string
  annee: number
  statut: StatutEngin
  kilometrage: number
  date_acquisition: string
  created_at: string
}

export type TypeMaintenance = 'vidange' | 'pneus' | 'freins' | 'moteur' | 'carrosserie' | 'révision-générale' | 'autre'

export interface Maintenance {
  id: string
  engin_id: string
  type: TypeMaintenance
  description: string
  cout: number
  date: string
  prestataire: string
  kilometrage_lors: number
  prochain_entretien_km?: number
  created_at: string
}

export interface Carburant {
  id: string
  engin_id: string
  litres: number
  cout: number
  kilometrage: number
  date: string
  agent_id: string
  created_at: string
}

export type StatutPanne = 'ouverte' | 'en-cours' | 'résolue'

export interface Panne {
  id: string
  engin_id: string
  description: string
  date: string
  statut: StatutPanne
  cout_reparation?: number
  date_resolution?: string
  created_at: string
}

export type CategorieConsommable = 'carburant' | 'epi' | 'pieces-detachees' | 'sacs-poubelle' | 'autre'
export type TypeMouvement = 'entrée' | 'sortie'

export interface Consommable {
  id: string
  nom: string
  categorie: CategorieConsommable
  unite: string
  stock_actuel: number
  seuil_alerte: number
  prix_unitaire: number
  created_at: string
}

export interface MouvementStock {
  id: string
  consommable_id: string
  type: TypeMouvement
  quantite: number
  date: string
  motif: string
  agent_id: string
  created_at: string
}

export interface Zone {
  id: string
  nom: string
  description?: string
  frequence_collecte: FrequenceCollecte
  created_at: string
}

export interface Rapport {
  id: string
  trimestre: string
  annee: number
  statut: 'brouillon' | 'finalisé'
  donnees: RapportDonnees
  created_at: string
  generated_at?: string
}

export interface RapportDonnees {
  abonnes_debut: number
  abonnes_fin: number
  taux_recouvrement_global: number
  taux_recouvrement_par_mois: { mois: string; taux: number }[]
  taux_collecte: number
  montant_encaisse_mm: number
  montant_encaisse_cash: number
  montant_total: number
  engins_etat: { id: string; immatriculation: string; km: number; statut: StatutEngin }[]
  incidents: { date: string; description: string }[]
}

export interface Organisation {
  id: string
  nom: string
  email: string
  telephone: string
  adresse: string
  commune: string
  num_contrat: string
  date_contrat: string
  objectif_abonnes: number
  objectif_recouvrement: number
  objectif_collecte: number
  paygate_merchant_id?: string
  created_at: string
}

export interface KpiData {
  abonnes_actifs: number
  objectif_abonnes: number
  taux_recouvrement: number
  objectif_recouvrement: number
  taux_collecte: number
  objectif_collecte: number
  engins_operationnels: number
  engins_total: number
  alertes_count: number
  recouvrement_par_mois: { mois: string; taux: number }[]
}

export interface Alerte {
  id: string
  type: 'panne-engin' | 'zone-non-couverte' | 'stock-bas' | 'recouvrement-faible' | 'impayé-multiple'
  titre: string
  description: string
  date: string
  lien?: string
  gravite: 'info' | 'attention' | 'critique'
}

export interface AppState {
  organisation: Organisation
  zones: Zone[]
  users: User[]
  abonnes: Abonne[]
  paiements: Paiement[]
  tournees: Tournee[]
  marquages: Marquage[]
  engins: Engin[]
  maintenances: Maintenance[]
  carburants: Carburant[]
  pannes: Panne[]
  consommables: Consommable[]
  mouvements_stock: MouvementStock[]
  rapports: Rapport[]
}
