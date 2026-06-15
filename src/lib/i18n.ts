// ─── i18n — Dictionnaire français + traduction côté serveur ──────────────────

const FR: Record<string, string> = {
  'nav.dashboard': 'Tableau de bord',
  'nav.abonnes': 'Abonnés',
  'nav.paiements': 'Paiements',
  'nav.tournees': 'Tournées',
  'nav.engins': 'Engins',
  'nav.employes': 'Employés',
  'nav.rapports': 'Rapports DSP',
  'nav.consommables': 'Consommables',
  'nav.prospection': 'Prospection',
  'nav.parametres': 'Paramètres',
  'nav.deconnexion': 'Déconnexion',
  'nav.admin': 'Admin plateforme',

  'dashboard.title': 'Tableau de bord',
  'dashboard.abonnesActifs': 'Abonnés actifs',
  'dashboard.tauxRecouvrement': 'Taux de recouvrement',
  'dashboard.tauxCollecte': 'Taux de collecte',
  'dashboard.enginsOperationnels': 'Engins opérationnels',
  'dashboard.encaisseMois': 'Encaissé ce mois',
  'dashboard.recouvrementMensuel': 'Recouvrement mensuel',
  'dashboard.alertes': 'Alertes actives',
  'dashboard.aucuneAlerte': 'Aucune alerte — tout est nominal',
  'dashboard.activiteRecente': 'Activité récente',
  'dashboard.voirTout': 'Voir tout',

  'abonnes.titre': 'Abonnés',
  'abonnes.nouveau': 'Nouvel abonné',
  'abonnes.rechercher': 'Rechercher un abonné…',
  'abonnes.statut.aJour': 'À jour',
  'abonnes.statut.enRetard': 'En retard',
  'abonnes.statut.impaye': 'Impayé',
  'abonnes.statut.inactif': 'Inactif',

  'paiements.titre': 'Paiements',
  'paiements.montant': 'Montant',
  'paiements.moyen': 'Moyen',
  'paiements.reference': 'Référence',
  'paiements.mois': 'Mois concerné',
  'paiements.date': 'Date',
  'paiements.mobileMoney': 'Mobile Money',
  'paiements.especes': 'Espèces',

  'tournees.titre': 'Tournées',
  'tournees.planifier': 'Planifier une tournée',
  'tournees.terrain': 'Mode terrain',

  'engins.titre': 'Engins',
  'engins.nouveau': 'Nouvel engin',

  'employes.titre': 'Employés',
  'employes.nouveau': 'Nouvel employé',

  'common.chargement': 'Chargement…',
  'common.erreur': 'Une erreur est survenue',
  'common.enregistrer': 'Enregistrer',
  'common.annuler': 'Annuler',
  'common.supprimer': 'Supprimer',
  'common.modifier': 'Modifier',
  'common.retour': 'Retour',
  'common.confirmer': 'Confirmer',
  'common.rechercher': 'Rechercher',
  'common.filtrer': 'Filtrer',
  'common.exporter': 'Exporter',
  'common.aucunResultat': 'Aucun résultat',

  'auth.connexion': 'Connexion',
  'auth.email': 'Email',
  'auth.motDePasse': 'Mot de passe',
  'auth.seConnecter': 'Se connecter',
  'auth.deconnexion': 'Déconnexion',
  'auth.motDePasseOublie': 'Mot de passe oublié ?',
  'auth.pasDeCompte': "Pas encore de compte ?",
  'auth.creerCompte': 'Créer un espace',
}

export type Lang = 'fr'

const DICT: Record<Lang, Record<string, string>> = { fr: FR }

/** Traduction côté serveur */
export function t(key: string, lang: Lang = 'fr', fallback?: string): string {
  return DICT[lang]?.[key] ?? fallback ?? key
}

export { FR as frDict }
