# Design Brief — WasteFlow

> Application web (SaaS) à concevoir pour un navigateur, responsive mobile + desktop. Le designer a toute autorité créative : palette, typographie, layout, composants, motion, densité, choix des écrans. Ce brief donne uniquement le pourquoi du projet et qui on sert. Si une direction non évoquée sert mieux le projet, prends-la.

---

## Le projet

WasteFlow est un outil de pilotage de contrats DSP (délégation de service public) pour les PME africaines chargées de la collecte des déchets ménagers. Il permet à un délégataire de suivre ses abonnés, encaisser via mobile money, planifier ses tournées, gérer ses engins et produire ses rapports de conformité pour la commune. Ce qui le distingue : aucun équivalent local n'existe en Afrique francophone — les outils européens coûtent dix fois trop cher et ignorent le contexte terrain.

---

## L'utilisateur

Le directeur d'une PME de collecte ouvre WasteFlow chaque matin depuis son téléphone Android, en déplacement entre les zones de collecte et la mairie. Il revient à l'app pour vérifier en un coup d'œil combien d'abonnés ont payé ce mois-ci, si les tournées ont été effectuées, et si un engin est tombé en panne. Sa frustration n°1 : il ne sait jamais, en temps réel, si son équipe a vraiment fait le travail — et la commune lui demande des comptes.

---

## Le marché & contexte

Togo, communes urbaines, usage quasi-exclusivement mobile sur navigateur, connectivité 3G variable. L'app doit être rapide, lisible en plein soleil, opérable d'une main. La donnée chiffrée (taux de recouvrement, nombre de tournées, état des engins) est le cœur du produit — elle doit sauter aux yeux, pas se cacher dans des sous-menus.

---

## À éviter (l'AI slop)

- Gradients violet→rose partout, glow animé sur chaque bouton/card
- Sparkles ✨ et étoiles décoratives sur les CTAs
- Glassmorphism violet générique
- Hero avec 6+ CTAs, 12 logos clients placeholder, 8 chips bullshit
- Stock photos d'équipe générique (sourires forcés + MacBooks)
- Animated underline qui grandit au hover sur chaque lien
- Toute UI qui marche aussi bien pour ce projet que pour 50 autres SaaS

---

## Ce qu'on attend

WasteFlow gère de la boue, des camions, des déchets et de l'argent public — pas des NFT ou une fintech Berlin-cool. L'UI doit sentir l'opérationnel : dense, direct, robuste. Pense tableau de bord de contrôleur, pas landing page startup. Données en premier, ornement jamais. Si on remplace "WasteFlow" par "TaskFlow", l'interface doit devenir incompréhensible — c'est le test.