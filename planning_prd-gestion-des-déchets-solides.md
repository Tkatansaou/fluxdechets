

# PRD — WasteFlow (SaaS de pilotage DSP – Déchets Solides)

---

## 1. Vision produit

**Pitch en une phrase**
WasteFlow aide les délégataires de collecte de déchets solides à piloter leur contrat DSP (abonnés, collecte, engins, recouvrement) et à prouver leur conformité aux communes, grâce au paiement mobile money intégré et des rapports automatiques.

**Problème résolu**
Les PME délégataires sous contrat DSP au Togo gèrent tout à la main : cahiers d'abonnés incomplets, encaissements en cash sans traçabilité, tournées non suivies, pannes d'engins non communiquées, et rapports trimestriels fabriqués dans la douleur sur Word. Résultat : la commune perd confiance, le taux de recouvrement stagne, et le délégataire risque la résiliation de son contrat.

**Pourquoi maintenant**
- Le contrat DSP de Vo1/Vogan (avenant N°1, juin 2026) impose des objectifs chiffrés : 900 abonnés, ≥80% de recouvrement, ≥99% de collecte, 100% d'entretien des engins. Le besoin d'un outil de pilotage est immédiat.
- Plus de 30 communes urbaines togolaises ont des contrats DSP similaires — aucun outil local n'existe pour les piloter.
- La pénétration du mobile money au Togo (Tmoney, Flooz) est 3× supérieure à celle des comptes bancaires : le canal de paiement est prêt.
- Les solutions européennes (AMCS, CAP Collecte) coûtent 300-1 500€/mois et sont inadaptées au contexte africain. Les startups africaines (Coliba, Wecyclers) ciblent le recyclage citoyen, pas le pilotage DSP. Le créneau est vide.

**Ce que le produit règle concrètement**

| Douleur actuelle | Solution WasteFlow |
|---|---|
| Listes d'abonnés sur papier, doublons, données périmées → impossible de connaître le vrai nombre d'actifs | Registre numérique d'abonnés avec statut de paiement en temps réel, rattachement à une zone de collecte, et historique complet |
| Recouvrement en cash opaque — le délégataire ne peut pas prouver le montant collecté à la commune | Paiement mobile money intégré (Tmoney/Flooz) avec reçu automatique horodaté, traçabilité totale, tableau de recouvrement partageable |
| Tournées planifiées au feeling, fréquences non respectées, aucune preuve de passage | Planning de tournées par zone avec marquage des collectes effectuées et alertes de non-conformité |
| Pannes d'engins non signalées, pas de suivi entretien ni carburant → arrêts de service sans préavis | Fiche par engin : historique entretien, signalement panne, consommation carburant — alertes proactives |
| Rapports trimestriels DSP fabriqués manuellement, données peu fiables, commune méfiante | Génération automatique du rapport trimestriel avec les KPIs exigés par le contrat DSP, export PDF prêt à signer |

---

## 2. Personas cibles

### Persona 1 — Kofi Mensah, 42 ans, Directeur de STADD-GIP-Togo, Vogan

**Contexte** : Dirige un consortium de 12 employés (6 agents terrain, 2 chauffeurs, 4 admin) délégataire du contrat DSP de Vo1. Gère 2 tricycles motorisés et 1 camion-benne. Objectif contractuel : 900 abonnés fin 2026.

**Pain points** :
- Ne connaît pas son vrai taux de recouvrement à un instant T — il doit compter les cahiers de quittances manuellement
- Passe 2 jours entiers chaque trimestre à compiler le rapport DSP pour la commune
- N'a aucune visibilité sur la consommation de carburant par engin — suspecte des pertes
- Quand un tricycle tombe en panne, il n'y a pas de système pour réorganiser la tournée — les ménages ne sont pas prévenus
- La commune lui reproche le manque de fiabilité des données

**Ce qu'il utilise aujourd'hui** : Cahiers papier pour les abonnés, WhatsApp pour la coordination terrain, Excel quand il y arrive, Word pour les rapports.

**Pouvoir d'achat** : Budget opérationnel mensuel encadré (subvention max 300 000 FCFA — 150k PASPEVO + 150k Commune). Un outil à 10 000-15 000 FCFA/mois est acceptable si ça réduit ses pertes de recouvrement.

---

### Persona 2 — Ama Sodji, 35 ans, Agent de recouvrement, Vogan

**Contexte** : Fait du porte-à-porte pour encaisser les 1 000 FCFA mensuels auprès des ménages abonnés. Gère une zone de ~200 foyers. Rend compte à Kofi avec des listes manuscrites.

**Pain points** :
- Certains ménages prétendent avoir déjà payé — impossible de vérifier sur le moment
- Transporte du cash et doit remettre le montant exact en fin de journée — risque d'erreurs et de vol
- Pas de moyen de signaler un foyer absent ou qui refuse de payer autrement que verbalement
- Ne sait pas toujours si la collecte a été effectuée dans sa zone (elle vient collecter l'argent mais le service n'a pas été rendu → conflit)

**Ce qu'elle utilise aujourd'hui** : Un cahier de tickets à souche, son téléphone basique pour appeler Kofi.

**Pouvoir d'achat** : Elle n'achète pas l'outil — c'est son employeur. Mais elle doit pouvoir l'utiliser sur un smartphone Android d'entrée de gamme avec un forfait data limité.

---

### Persona 3 — Dr Kalépé Kokou, 55 ans, Maire de Vo1, Vogan

**Contexte** : Autorité contractante du contrat DSP. Doit contrôler la performance du délégataire mais n'a aucun moyen de vérification indépendant. Dépend des rapports que le délégataire lui-même produit.

**Pain points** :
- Ne sait pas si le délégataire atteint réellement les 80% de recouvrement ou s'il gonfle les chiffres
- Reçoit des plaintes de citoyens sur la non-collecte mais ne peut pas croiser avec les données de tournées
- Pas de visibilité sur l'état des engins — découvre les pannes quand le service s'arrête
- Veut un tableau de bord lisible, pas un tableur Excel

**Ce qu'il utilise aujourd'hui** : Les rapports trimestriels papier du délégataire, les plaintes orales des citoyens.

**Pouvoir d'achat** : N'est pas le client payant — il accède à WasteFlow en lecture seule (fonctionnalité offerte au délégataire pour renforcer la confiance). C'est un argument de vente pour convaincre le délégataire de s'abonner.

---

## 3. Pages & écrans

### Parcours principal — Délégataire (Kofi)

**3.1 — Page de connexion**
- Permet au délégataire et à ses agents de s'authentifier pour accéder à l'espace de travail.
- Accès : tous les utilisateurs enregistrés.
- Actions clés : se connecter avec email/téléphone + mot de passe ; réinitialiser son mot de passe.

**3.2 — Tableau de bord DSP**
- Vue synthétique de la santé du contrat DSP : le délégataire voit en un coup d'œil s'il est conforme ou en danger.
- Accès : Kofi (admin délégataire) — c'est la page d'accueil après connexion.
- Actions clés : consulter les 5 KPIs contractuels en temps réel (taux de recouvrement, taux de collecte, nombre d'abonnés actifs, état des engins, alertes) ; choisir la période d'affichage ; accéder en un clic à la section correspondant à un KPI en alerte.

**3.3 — Page liste des abonnés**
- Registre complet de tous les ménages abonnés au service de collecte, avec leur statut de paiement.
- Accès : Kofi et Ama (agent de recouvrement).
- Actions clés : rechercher un abonné par nom, téléphone ou zone ; voir le statut de paiement (à jour / en retard / impayé) ; accéder à la fiche détaillée d'un abonné.

**3.4 — Page fiche abonné**
- Détail complet d'un abonné : coordonnées, zone de collecte, historique des paiements, historique des collectes.
- Accès : Kofi et Ama.
- Actions clés : modifier les informations de l'abonné ; enregistrer un paiement manuel (cash) ; voir l'historique chronologique complet (paiements + collectes) ; désactiver un abonné (départ, résiliation).

**3.5 — Page création / modification d'un abonné**
- Formulaire pour enregistrer un nouveau ménage abonné ou modifier un existant.
- Accès : Kofi et Ama.
- Actions clés : saisir nom, prénom, téléphone, adresse/repère, zone de collecte ; choisir la fréquence de collecte ; activer/désactiver l'abonné.

**3.6 — Page paiements & recouvrement**
- Vue consolidée de tous les paiements reçus et des impayés. C'est le nerf de la guerre.
- Accès : Kofi.
- Actions clés : voir la liste des paiements reçus (mobile money + cash) avec date, montant, abonné, moyen de paiement ; filtrer par période, zone, statut ; voir le taux de recouvrement global et par zone ; exporter la liste des impayés.

**3.7 — Page de paiement mobile money (côté abonné)**
- Page accessible par le ménage abonné (via lien SMS ou QR code) pour payer sa redevance mensuelle en Tmoney ou Flooz.
- Accès : le ménage abonné (sans compte — accès par lien unique).
- Actions clés : choisir son moyen de paiement (Tmoney ou Flooz) ; payer sa redevance de 1 000 FCFA ; recevoir un reçu de paiement sur son téléphone.

**3.8 — Page planning des tournées**
- Calendrier des tournées de collecte par zone et par jour.
- Accès : Kofi.
- Actions clés : créer/modifier une tournée (zone, jour, engin, chauffeur) ; voir les tournées de la semaine ; identifier les zones non couvertes.

**3.9 — Page suivi d'une tournée (saisie terrain)**
- Écran simplifié pour l'agent terrain qui marque les points de collecte effectués pendant sa tournée.
- Accès : chauffeur/agent terrain (sur smartphone pendant la tournée).
- Actions clés : marquer un point de collecte comme "effectué" ou "non effectué" (avec motif : accès bloqué, bac absent, panne) ; signaler un incident ; terminer la tournée.

**3.10 — Page gestion des engins**
- Liste de tous les véhicules et tricycles du délégataire avec leur état.
- Accès : Kofi.
- Actions clés : voir la fiche de chaque engin (immatriculation, type, statut opérationnel, kilométrage) ; ajouter un nouvel engin ; accéder au détail d'un engin.

**3.11 — Page fiche engin**
- Détail d'un engin : historique d'entretien, consommation de carburant, pannes.
- Accès : Kofi.
- Actions clés : enregistrer un entretien (type, coût, date) ; enregistrer un plein de carburant (litres, coût, kilométrage) ; signaler une panne ; voir l'historique chronologique complet.

**3.12 — Page rapports DSP**
- Génération et consultation des rapports périodiques exigés par le contrat DSP.
- Accès : Kofi.
- Actions clés : générer un rapport trimestriel (sélectionner la période) ; prévisualiser le rapport ; exporter en PDF.

**3.13 — Page gestion des consommables**
- Suivi des stocks de carburant, EPI, pièces détachées, sacs poubelle.
- Accès : Kofi.
- Actions clés : voir le stock actuel par catégorie ; enregistrer une entrée (achat) ou sortie (consommation) ; recevoir une alerte quand un stock passe sous le seuil minimum.

**3.14 — Page paramètres du compte**
- Configuration de l'espace du délégataire.
- Accès : Kofi (admin).
- Actions clés : gérer les utilisateurs (ajouter/supprimer agents, chauffeurs) ; configurer les zones de collecte ; modifier les informations de l'entreprise ; configurer le lien PayGate (clé API mobile money).

### Parcours secondaire — Commune (Dr Kalépé)

**3.15 — Tableau de bord commune (lecture seule)**
- Vue simplifiée des KPIs du délégataire pour le contrôle communal.
- Accès : Dr Kalépé (via un lien d'accès fourni par le délégataire, avec identifiant propre).
- Actions clés : consulter les KPIs contractuels (recouvrement, collecte, engins, abonnés) ; consulter les rapports trimestriels générés ; filtrer par période.

---

## 4. Fonctionnalités MVP (V1)

### Gestion des abonnés

| Feature | Description | Priorité |
|---|---|---|
| Registre d'abonnés | Créer, modifier, rechercher et désactiver un abonné. Chaque abonné est rattaché à une zone de collecte et a un statut de paiement calculé automatiquement (à jour / en retard / impayé). | P0 |
| Import d'abonnés existants | Importer une liste d'abonnés depuis un fichier CSV pour ne pas ressaisir les 200-400 abonnés existants de STADD. | P0 |
| Historique par abonné | Voir la chronologie complète d'un abonné : tous ses paiements et toutes les collectes effectuées à son adresse. | P0 |
| Recherche et filtres | Chercher un abonné par nom, téléphone ou zone. Filtrer la liste par statut de paiement (à jour / en retard / impayé) et par zone. | P0 |

### Paiement mobile money

| Feature | Description | Priorité |
|---|---|---|
| Paiement Tmoney/Flooz | L'abonné ménage reçoit un lien (par SMS) et paie sa redevance mensuelle de 1 000 FCFA via Tmoney ou Flooz. Le paiement est automatiquement enregistré et rattaché à son compte. | P0 |
| Reçu automatique | Après paiement, l'abonné reçoit une confirmation SMS avec le montant, la date et le numéro de reçu. Le délégataire voit le paiement apparaître instantanément dans son tableau. | P0 |
| Enregistrement paiement cash | Ama peut enregistrer un paiement en espèces reçu en porte-à-porte, pour ne pas exclure les ménages qui ne veulent/peuvent pas payer en mobile money. | P0 |
| Suivi recouvrement temps réel | Tableau consolidé des paiements reçus et impayés, avec taux de recouvrement global et par zone, mis à jour en temps réel. | P0 |
| Relance des impayés | Envoi d'un SMS de rappel aux abonnés en retard de paiement (déclenchement manuel par Kofi ou automatique après X jours de retard). | P1 |

### Suivi des tournées

| Feature | Description | Priorité |
|---|---|---|
| Planning de tournées | Créer un planning hebdomadaire : affecter une zone, un engin et un chauffeur à chaque jour de collecte. | P0 |
| Marquage terrain | L'agent terrain marque chaque point de collecte comme effectué ou non effectué (avec motif) depuis son téléphone pendant la tournée. | P0 |
| Alertes non-conformité | Si une zone n'a pas été collectée alors qu'elle aurait dû l'être selon le planning, une alerte remonte sur le tableau de bord de Kofi. | P0 |
| Taux de collecte | Calcul automatique du taux de collecte (nombre de passages effectués / nombre de passages prévus) — KPI exigé par le contrat DSP. | P0 |

### Tableau de bord DSP

| Feature | Description | Priorité |
|---|---|---|
| KPIs temps réel | 5 indicateurs clés affichés en permanence : nombre d'abonnés actifs, taux de recouvrement (%), taux de collecte (%), nombre d'engins opérationnels vs total, nombre d'alertes en cours. | P0 |
| Période ajustable | Choisir la période d'affichage (ce mois, ce trimestre, personnalisé) pour comparer les performances. | P0 |
| Accès rapide | Chaque KPI en alerte (sous le seuil contractuel) est cliquable et mène directement à la section concernée. | P0 |

### Gestion des engins

| Feature | Description | Priorité |
|---|---|---|
| Fiche engin | Créer une fiche par véhicule/tricycle : immatriculation, type (tricycle, camion-benne), date d'acquisition, statut (opérationnel / en panne / en maintenance). | P0 |
| Suivi entretien | Enregistrer chaque opération d'entretien (type, date, coût, prestataire). Programmer les prochains entretiens avec rappel. | P0 |
| Suivi carburant | Enregistrer chaque plein (litres, coût, kilométrage). Calcul automatique de la consommation moyenne pour détecter les anomalies. | P0 |
| Signalement panne | Signaler une panne avec description. Le statut de l'engin passe automatiquement à "en panne" et l'alerte remonte au tableau de bord. | P0 |

### Rapports automatiques

| Feature | Description | Priorité |
|---|---|---|
| Génération rapport trimestriel | Générer en un clic le rapport de performance du trimestre avec tous les KPIs contractuels pré-remplis à partir des données réelles. | P1 |
| Export PDF | Exporter le rapport en PDF au format attendu par la commune, prêt à être signé et remis. | P1 |
| Historique des rapports | Conserver tous les rapports générés pour référence future. | P1 |

### Gestion des consommables

| Feature | Description | Priorité |
|---|---|---|
| Suivi de stock | Enregistrer les entrées (achats) et sorties (consommations) de carburant, EPI, pièces détachées, sacs poubelle. | P1 |
| Alertes seuil minimal | Recevoir une notification quand un stock passe sous le seuil minimum défini par le délégataire. | P1 |

### Espace commune

| Feature | Description | Priorité |
|---|---|---|
| Tableau de bord commune | La mairie accède en lecture seule aux KPIs du délégataire et aux rapports trimestriels, via un compte dédié avec permissions restreintes. | P2 |
| Aucun droit de modification | La commune voit, ne modifie rien. Transparence sans ingérence. | P2 |

---

## 5. User Stories principales

### US-1 : Enregistrer un nouvel abonné

**En tant que** Kofi (admin délégataire), **je veux** enregistrer un nouveau ménage abonné avec son nom, téléphone, adresse et zone de collecte, **afin de** l'ajouter officiellement au registre et suivre ses paiements dès le premier mois.

**Critères d'acceptation :**
- Le formulaire exige au minimum : nom complet, numéro de téléphone, zone de collecte.
- Un doublon est détecté si un abonné avec le même numéro de téléphone existe déjà — un avertissement s'affiche.
- L'abonné créé apparaît immédiatement dans la liste avec le statut "impayé" (aucun paiement enregistré).
- L'abonné est rattaché à une zone de collecte existante (créée au préalable dans les paramètres).

---

### US-2 : Importer la liste existante d'abonnés

**En tant que** Kofi, **je veux** importer un fichier CSV contenant mes abonnés actuels, **afin de** ne pas ressaisir manuellement les 200-400 ménages déjà inscrits.

**Critères d'acceptation :**
- Le système accepte un fichier CSV avec les colonnes : nom, téléphone, adresse, zone.
- Avant import, un aperçu montre les lignes valides et les erreurs (téléphone invalide, zone inconnue, doublon).
- Les lignes en erreur sont ignorées mais listées pour correction manuelle.
- Les abonnés importés ont le statut "impayé" par défaut.

---

### US-3 : Payer sa redevance par mobile money

**En tant que** ménage abonné (sans compte WasteFlow), **je veux** payer ma redevance mensuelle de 1 000 FCFA via Tmoney ou Flooz en cliquant sur un lien reçu par SMS, **afin de** ne plus devoir attendre le passage de l'agent de recouvrement et avoir une preuve de paiement.

**Critères d'acceptation :**
- Le lien de paiement est unique par abonné et réutilisable chaque mois.
- La page de paiement affiche le nom de l'abonné, le montant (1 000 FCFA) et les frais éventuels (100-110 FCFA).
- L'abonné choisit entre Tmoney et Flooz.
- Après paiement réussi, l'abonné reçoit un SMS de confirmation avec numéro de reçu.
- Le paiement apparaît dans le tableau de recouvrement de Kofi en moins de 2 minutes.
- En cas d'échec de paiement, un message clair explique le problème et propose de réessayer.

---

### US-4 : Enregistrer un paiement en espèces

**En tant que** Ama (agent de recouvrement), **je veux** enregistrer un paiement en espèces reçu lors de ma tournée de porte-à-porte, **afin que** le système reflète le vrai taux de recouvrement, y compris les paiements cash.

**Critères d'acceptation :**
- Ama recherche l'abonné par nom ou téléphone.
- Elle saisit le montant reçu (pré-rempli à 1 000 FCFA, modifiable).
- Le paiement est marqué comme "espèces" pour le distinguer du mobile money.
- Le statut de l'abonné passe à "à jour" immédiatement.
- L'opération est tracée avec l'identité de l'agent qui l'a enregistrée (Ama) et l'horodatage.

---

### US-5 : Consulter le taux de recouvrement

**En tant que** Kofi, **je veux** voir mon taux de recouvrement global et par zone pour le mois en cours, **afin de** savoir si j'atteins l'objectif contractuel de 80% et identifier les zones problématiques.

**Critères d'acceptation :**
- Le taux de recouvrement = (nombre d'abonnés à jour / nombre d'abonnés actifs) × 100.
- Le taux est affiché sur le tableau de bord avec un code couleur : vert (≥80%), orange (60-79%), rouge (<60%).
- Le détail par zone est accessible en un clic.
- Kofi peut filtrer par mois pour comparer l'évolution.

---

### US-6 : Planifier une tournée de collecte

**En tant que** Kofi, **je veux** créer le planning de collecte de la semaine en affectant une zone, un engin et un chauffeur à chaque jour, **afin que** chaque zone soit couverte selon la fréquence prévue au contrat DSP.

**Critères d'acceptation :**
- Le planning se présente sous forme de grille hebdomadaire (lundi-samedi).
- Kofi sélectionne pour chaque créneau : la zone, l'engin (parmi ceux au statut "opérationnel") et le chauffeur.
- Si un engin est en panne, il n'apparaît pas dans la liste des engins disponibles.
- Si une zone n'est affectée à aucun jour de la semaine, un avertissement visuel s'affiche.
- Le planning est visible par les agents terrain depuis leur téléphone.

---

### US-7 : Marquer une collecte comme effectuée

**En tant que** chauffeur/agent terrain, **je veux** marquer chaque point de collecte comme "effectué" ou "non effectué" pendant ma tournée, **afin que** Kofi ait une preuve du passage et puisse calculer le taux de collecte.

**Critères d'acceptation :**
- L'agent voit la liste des points de collecte de sa tournée du jour.
- Pour chaque point, il tape "effectué" ou "non effectué".
- Si "non effectué", il doit sélectionner un motif parmi : accès bloqué, bac absent, panne engin, autre (texte libre).
- La saisie fonctionne même avec une connexion intermittente — les données se synchronisent automatiquement quand la connexion revient.
- L'horodatage de chaque marquage est enregistré.

---

### US-8 : Signaler une panne d'engin

**En tant que** Kofi ou un chauffeur, **je veux** signaler qu'un engin est en panne avec une description du problème, **afin que** le tableau de bord reflète l'indisponibilité et que la tournée puisse être réorganisée.

**Critères d'acceptation :**
- Le signalement inclut : engin concerné, description de la panne, date.
- Le statut de l'engin passe automatiquement de "opérationnel" à "en panne".
- L'engin en panne n'est plus proposable pour les futures tournées.
- Une alerte apparaît sur le tableau de bord de Kofi.
- Quand l'engin est réparé, Kofi change le statut à "opérationnel" et enregistre l'intervention (coût, description).

---

### US-9 : Générer le rapport trimestriel DSP

**En tant que** Kofi, **je veux** générer automatiquement mon rapport trimestriel à partir des données réelles du trimestre, **afin de** le remettre à la commune sans passer 2 jours à compiler les chiffres manuellement.

**Critères d'acceptation :**
- Kofi sélectionne le trimestre souhaité.
- Le rapport inclut : nombre d'abonnés (début/fin de période), taux de recouvrement mensuel et trimestriel, taux de collecte, état et kilométrage des engins, incidents signalés, montants encaissés (mobile money + cash).
- Le rapport est prévisualisable avant export.
- L'export PDF est formaté proprement avec l'en-tête du délégataire.
- Le rapport est sauvegardé dans l'historique.

---

### US-10 : Consulter le tableau de bord commune

**En tant que** Dr Kalépé (maire de Vo1), **je veux** accéder à un tableau de bord montrant les KPIs du délégataire, **afin de** vérifier que le contrat DSP est respecté sans dépendre des rapports auto-déclaratifs.

**Critères d'acceptation :**
- Dr Kalépé se connecte avec un identifiant spécifique (créé par le délégataire).
- Il voit les mêmes KPIs que le délégataire : abonnés actifs, taux de recouvrement, taux de collecte, état des engins.
- Il peut consulter les rapports trimestriels générés.
- Il ne peut modifier aucune donnée — lecture seule stricte.
- Il ne voit pas les données financières détaillées du délégataire (montants des paiements individuels), uniquement les taux agrégés.

---

## 6. Business Model & Monétisation

### Modèle de revenus

**Modèle hybride : abonnement fixe + commission sur paiements mobile money.**

Ce modèle est aligné sur le terrain : l'abonnement finance l'accès aux outils de pilotage, la commission aligne les intérêts (plus le délégataire collecte, plus WasteFlow gagne) et résout le problème de transparence du recouvrement.

### Grille tarifaire

| Composante | Montant | Détail |
|---|---|---|
| Abonnement mensuel | 10 000 FCFA/mois | Accès complet au SaaS : abonnés, tournées, engins, tableau de bord, utilisateurs illimités |
| Commission mobile money | 3-5% par transaction | Prélevé sur chaque paiement mobile money traité via WasteFlow. Sur 1 000 FCFA de redevance = 30-50 FCFA par paiement. |

**Note :** les frais de passerelle PayGate (Tmoney/Flooz) de ~100 FCFA + taxe 10% (= ~110 FCFA) sont à la charge de l'abonné ménage. La commission WasteFlow de 3-5% est prélevée sur le montant restant reçu par le délégataire.

### Projection de revenus

| Scénario | Abonnement | Commission (5%) | Total mensuel |
|---|---|---|---|
| 1 délégataire, 900 abonnés, 80% recouvrement | 10 000 FCFA | 36 000 FCFA | **46 000 FCFA** |
| 5 délégataires, 500 abonnés moy., 75% recouvrement | 50 000 FCFA | 93 750 FCFA | **143 750 FCFA** |
| 15 délégataires, 600 abonnés moy., 80% recouvrement | 150 000 FCFA | 360 000 FCFA | **510 000 FCFA** |

### Moyens de paiement acceptés

**Pour les délégataires (abonnement mensuel) :**
- Mobile money : Tmoney, Flooz (obligatoire)
- Virement bancaire (complément pour les délégataires structurés)

**Pour les ménages abonnés (redevance) :**
- Tmoney et Flooz via PayGate Global (canal principal)
- Espèces encaissées par l'agent de recouvrement et enregistrées manuellement dans le système

### Pas de plan gratuit

Contrairement à un SaaS B2C classique, WasteFlow est un outil B2B vendu à des entreprises sous contrat public. Le freemium n'a pas de sens ici : le délégataire a un contrat avec des obligations, il a besoin que l'outil fonctionne immédiatement.

**Alternative :** essai gratuit de 30 jours pour le premier délégataire (STADD-GIP-Togo) afin de prouver la valeur sur le terrain avant de facturer. Cet essai sert aussi de cas d'étude pour convaincre les suivants.

---

## 7. Métriques de succès

### Métriques de lancement (90 premiers jours)

| KPI | Cible | Justification |
|---|---|---|
| Premier délégataire actif (STADD) | 1 dans les 30 premiers jours | STADD est déjà identifié et en relation avec Tchaa. L'onboarding doit être rapide. |
| Abonnés enregistrés dans le système | ≥ 300 (sur 400-500 existants chez STADD) | Prouve que l'import et la saisie fonctionnent à l'échelle réelle. |
| Paiements mobile money traités | ≥ 50 paiements le premier mois | L'objectif n'est pas de convertir 100% au mobile money immédiatement. 10-15% des abonnés qui passent au digital le premier mois est un bon signal. |
| Taux de recouvrement visible | Le taux de recouvrement affiché dans WasteFlow est vérifié et validé par STADD comme cohérent avec la réalité. | Si le chiffre est faux, l'outil perd toute crédibilité. |
| Rapport trimestriel généré | 1 rapport complet généré et jugé "utilisable" par Kofi | C'est la feature qui fait gagner 2 jours de travail à Kofi — elle doit fonctionner du premier coup. |

### Métriques à 6 mois

| KPI | Cible | Justification |
|---|---|---|
| Délégataires payants | 3 à 5 | Croissance via le bouche-à-oreille dans le réseau DSP togolais + démarchage direct par Tchaa. |
| Taux d'adoption mobile money chez les abonnés | ≥ 30% des abonnés paient par mobile money | Migration progressive du cash au digital. |
| Taux de rétention délégataire | 100% (aucun churn) | Sur un marché aussi petit, perdre un client est critique. Le produit doit être indispensable. |
| Revenu mensuel récurrent | ≥ 100 000 FCFA | Seuil minimum pour couvrir les coûts d'hébergement et de passerelle. |

### Métriques à 12 mois

| KPI | Cible |
|---|---|
| Délégataires payants | 8 à 12 |
| Revenu mensuel récurrent | ≥ 300 000 FCFA |
| Au moins 1 commune utilisant l'espace lecture seule | Preuve que l'argument "transparence" fonctionne |
| Expansion au-delà du Togo | 1 contact qualifié dans un pays voisin (Bénin, Ghana) |

---

## 8. Ce qui est HORS SCOPE V1

| Feature exclue | Pourquoi |
|---|---|
| GPS tracking en temps réel des engins | Nécessite du matériel embarqué (traceurs GPS) et une intégration IoT complexe. En V1, le suivi se fait par marquage manuel des points de collecte. |
| Application mobile native (iOS/Android) | WasteFlow est une application web responsive, accessible depuis le navigateur du téléphone. Pas besoin d'aller sur Play Store — ça simplifie la distribution et les mises à jour. |
| Facturation automatique aux abonnés | En V1, c'est le délégataire qui envoie les liens de paiement. La facturation automatique (prélèvement mensuel automatique, émission de facture) viendra en V2. |
| Gestion multi-commune par un seul délégataire | Un délégataire = un espace = un contrat DSP. Si un délégataire a 3 contrats, il aura 3 espaces en V1. La consolidation multi-contrat viendra après validation terrain. |
| Gestion des décharges / sites de dépôt final | Le contrat DSP de Vo1 mentionne la décharge mais le suivi de la décharge elle-même (tonnage, conformité environnementale) est un produit à part entière. Hors scope. |
| Module RH / paie des agents | WasteFlow gère les tournées et les engins, pas la paie. Les délégataires ont des effectifs de 5-15 personnes — un tableur suffit pour la paie. |
| Intégration comptable (export vers un logiciel comptable) | Prématuré. En V1, l'export CSV des paiements suffit pour le comptable. |
| Notifications push | L'application web utilise les SMS comme canal de notification (reçus de paiement, rappels). Les notifications push navigateur seront testées en V2. |
| Multi-langue (anglais, éwé, kabyè) | V1 en français uniquement. Les délégataires et agents communaux opèrent en français. |

---

## 9. Risques et mitigation

### Risque 1 — Résistance des ménages au paiement mobile money

**Le risque :** Les abonnés à Vogan paient 1 000 FCFA/mois. Les frais mobile money de 100-110 FCFA représentent 11% du montant. Beaucoup préféreront continuer à payer en cash pour éviter ces frais.

**Mitigation :**
- Conserver le paiement cash enregistré dans le système comme option de premier ordre — ne pas forcer la migration mobile money.
- Positionner le mobile money comme un avantage pour l'abonné : "payez quand vous voulez, pas besoin d'attendre l'agent, recevez votre preuve de paiement par SMS".
- Négocier avec PayGate une absorption partielle des frais par le délégataire sur les 6 premiers mois pour encourager l'adoption.
- Objectif réaliste : 15-30% d'adoption mobile money la première année, pas 100%.

### Risque 2 — Dépendance au premier client (STADD)

**Le risque :** Si STADD est le seul client pendant 6-12 mois, tout le produit est façonné pour ses besoins spécifiques. Si STADD résilie son contrat DSP ou arrête d'utiliser WasteFlow, le revenu tombe à zéro.

**Mitigation :**
- Dès le mois 2, commencer à démarcher d'autres délégataires dans les communes voisines. Tchaa a l'accès terrain et le réseau.
- Construire le produit de manière standard (zones, engins, abonnés — pas "tricycles de STADD" ou "zone Vogan"). Pas de personnalisation client-spécifique.
- Utiliser STADD comme cas d'étude : témoignage, captures d'écran du tableau de bord avec métriques réelles (anonymisées si besoin).

### Risque 3 — Conflit d'intérêt fonctionnaire/entrepreneur

**Le risque :** Tchaa est fonctionnaire et participe aux réunions DSP au nom de l'État. Créer un SaaS vendu aux délégataires qu'il est censé contrôler peut poser un problème d'éthique ou juridique.

**Mitigation :**
- Tchaa vérifie auprès de sa hiérarchie que l'activité entrepreneuriale ne contrevient pas à son statut (responsabilité personnelle de Tchaa, déjà discuté en discovery).
- Prévoir une séparation nette : WasteFlow est une entité commerciale distincte, pas un outil de contrôle étatique. Le produit sert le délégataire, pas l'État.
- À terme, la retraite anticipée de la fonction publique (plan annoncé par Tchaa) résout le problème définitivement.

### Risque 4 — Fiabilité de la passerelle de paiement PayGate

**Le risque :** PayGate Global est une passerelle locale togolaise. En cas de panne, d'indisponibilité ou de changement de conditions tarifaires, les paiements mobile money sont bloqués et le modèle commission s'effondre.

**Mitigation :**
- Prévoir contractuellement un SLA minimum avec PayGate.
- Identifier une passerelle de backup (Moneroo, qui agrège Tmoney/Flooz/Wave) pour pouvoir basculer si PayGate faillit.
- Le paiement cash reste toujours disponible — le système ne dépend jamais à 100% du mobile money.

### Risque 5 — Adoption par les agents terrain peu lettrés numériquement

**Le risque :** Ama et les chauffeurs de STADD n'ont probablement jamais utilisé un outil professionnel sur smartphone. L'interface doit être extrêmement simple, sinon ils abandonneront et reviendront au papier.

**Mitigation :**
- L'écran de saisie terrain (marquage collecte) est conçu pour être utilisable en 2 taps maximum : "effectué" ou "non effectué" + motif.
- Formation initiale sur site de 2h pour tous les agents de STADD, animée par Tchaa en personne.
- L'interface terrain est optimisée pour les smartphones Android d'entrée de gamme (écran 5 pouces, connexion 2G/3G intermittente, mode hors-ligne avec synchronisation automatique).
- Support WhatsApp direct avec Tchaa pendant les 3 premiers mois.