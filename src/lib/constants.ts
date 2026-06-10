// App-wide constants — never secret (safe to NEXT_PUBLIC)

export const API_URL =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
    : ''

export const COOKIE_PREFIX = process.env.NEXT_PUBLIC_COOKIE_PREFIX ?? 'wf'

// WasteFlow business constants
export const MONTANT_REDEVANCE = 1000 // FCFA/mois
export const FRAIS_MOBILE_MONEY = 110 // FCFA (Bictorys/Moneroo fees ~110 FCFA)
export const COMMISSION_WASTEFLOW = 0.04 // 4%

// Payment gateway labels
export const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  moneroo: 'Moneroo',
  bictorys: 'Bictorys',
  demo: 'Simulation',
}

// Mobile money operator config
export const OPERATEUR_MM: Record<string, { label: string; color: string }> = {
  tmoney: { label: 'T-Money',  color: '#FF6B00' },
  flooz:  { label: 'Flooz',    color: '#E83E8C' },
  moov:   { label: 'Moov',     color: '#0078D4' },
}

export const OBJECTIF_ABONNES_DEFAULT = 900
export const OBJECTIF_RECOUVREMENT_DEFAULT = 80 // %
export const OBJECTIF_COLLECTE_DEFAULT = 99 // %

// Aliases courts utilisés dans les pages
export const OBJECTIF_RECOUVREMENT = OBJECTIF_RECOUVREMENT_DEFAULT
export const OBJECTIF_COLLECTE = OBJECTIF_COLLECTE_DEFAULT

// Seuils de couleur pour le taux de recouvrement
export const SEUIL_RECOUVREMENT_VERT = 80   // >= 80% → vert
export const SEUIL_RECOUVREMENT_ORANGE = 60  // >= 60% → orange, < 60% → rouge

export const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
export const MOIS_COURTS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Directeur / Admin',
  'agent-recouvrement': 'Agent de recouvrement',
  chauffeur: 'Chauffeur',
  commune: 'Commune (lecture seule)',
}

export const STATUT_ABONNE_LABELS: Record<string, string> = {
  'à-jour': 'À jour',
  'en-retard': 'En retard',
  'impayé': 'Impayé',
  'inactif': 'Inactif',
}

export const STATUT_ENGIN_LABELS: Record<string, string> = {
  'opérationnel': 'Opérationnel',
  'en-panne': 'En panne',
  'en-maintenance': 'En maintenance',
}

export const STATUT_TOURNEE_LABELS: Record<string, string> = {
  'planifiée': 'Planifiée',
  'en-cours': 'En cours',
  'terminée': 'Terminée',
  'annulée': 'Annulée',
}

export const TYPE_ENGIN_LABELS: Record<string, string> = {
  'tricycle': 'Tricycle motorisé',
  'camion-benne': 'Camion-benne',
  'charrette': 'Charrette',
}

export const CATEGORIE_CONSOMMABLE_LABELS: Record<string, string> = {
  'carburant': 'Carburant',
  'epi': 'EPI',
  'pieces-detachees': 'Pièces détachées',
  'sacs-poubelle': 'Sacs poubelle',
  'autre': 'Autre',
}

export const MOTIF_NON_EFFECTUE_LABELS: Record<string, string> = {
  'accès-bloqué': 'Accès bloqué',
  'bac-absent': 'Bac absent',
  'panne-engin': 'Panne engin',
  'autre': 'Autre',
}

export const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
