# AGENTS.md — WasteFlow

WasteFlow est un SaaS de pilotage de contrats DSP (délégation de service public) pour les PME africaines de collecte des déchets ménagers. Cible initiale : Togo, FCFA (XOF), mobile money Tmoney/Flooz via Bictorys.

Infrastructure adaptée de **izikit** (faratasn-pixel/izikit) : Next.js 16 + Prisma 5 + Neon + JWT auth + Bictorys.

> **État migration (juin 2026)** : toutes les pages `(app)` sont connectées aux vraies API REST — `AppContext` (mock localStorage) n'est plus utilisé dans aucune page métier.

---

## Stack

- **App** : Next.js 16 App Router, React 19, TypeScript strict
- **Base de données** : Prisma 5 (PostgreSQL / Neon serverless)
- **Auth** : JWT + CSRF cookies (access 15min / refresh 7j)
- **Paiements** : Bictorys (mobile money XOF — Tmoney/Flooz Togo)
- **Email** : Resend (optionnel)
- **Cache/Rate-limit** : Upstash Redis (optionnel en dev, obligatoire en prod)
- **Monitoring** : Sentry (optionnel, env-gated)
- **UI** : Tailwind v3, Recharts, Lucide React

---

## Commandes

| Tâche | Commande |
|---|---|
| Développement | `npm run dev` |
| Build | `npm run build` |
| Tests TypeScript | `npm run typecheck` |
| Migration DB (dev) | `npm run db:migrate:dev` |
| Migration DB (prod) | `npm run db:migrate:deploy` |
| Push schema direct | `npm run db:push` |
| Prisma Studio | `npm run db:studio` |
| Seed dev data | `npm run seed` |

---

## Architecture

### Routes API

Toutes les routes déclarent `export const runtime = 'nodejs'` (Prisma + bcrypt + cookies).

Pattern standard :
```ts
export const runtime = 'nodejs'
export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrf = verifyCsrf(req)
  if (csrf) return csrf
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth
  // ... logique métier
}
```

### Auth

- **`src/lib/server/auth.ts`** — JWT signer/verifier, cookie issuance, CSRF
- **`src/lib/server/middleware.ts`** — `requireAuth`, `requireAdmin`, `requireOrgAccess`
- **`src/lib/api.ts`** — Client fetch wrapper (CSRF auto, refresh auto sur 401)
- **`src/contexts/AuthContext.tsx`** — React context `useAuth()`, `useUser()`

### Pattern pages client

Toutes les pages `(app)` suivent le même pattern :

```ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'

// 1. Charger via useCallback + useEffect
const load = useCallback(async () => { ... }, [deps])
useEffect(() => { load() }, [load])

// 2. Muter via api() avec body typé
await api('/api/resource', { method: 'POST', body: { ... } })

// 3. Erreurs avec toast.error(err instanceof ApiError ? err.message : 'Erreur')
```

Conversions clés mock → Prisma : `zone_id→zoneId`, `lien_paiement_token→lienPaiementToken`, `stock_actuel→stockActuel`, `seuil_alerte→seuilAlerte`, `prix_unitaire→prixUnitaire`, `mois_concerne→moisConcerne`, `date_acquisition→dateAcquisition`.

### Routes API disponibles

| Route | Méthodes | Description |
|---|---|---|
| `/api/abonnes` | GET, POST | Liste (q, zoneId, statut), création |
| `/api/abonnes/[id]` | GET, PATCH, DELETE | Fiche + paiements + marquages |
| `/api/zones` | GET, POST | Zones de l'org — lookup + création |
| `/api/membres` | GET | Membres de l'org avec user (lookup) |
| `/api/paiements` | GET, POST | Recouvrement, saisie manuelle |
| `/api/engins` | GET, POST | Flotte |
| `/api/engins/[id]` | GET, PATCH | Fiche + actions dispatch |
| `/api/tournees` | GET, POST | Planning (debut/fin params) |
| `/api/tournees/[id]` | GET, PATCH, POST | Fiche, statut, marquages |
| `/api/consommables` | GET, POST | Stocks + mouvementsRecents |
| `/api/consommables/[id]` | GET, POST | Fiche + mouvement stock |
| `/api/rapports` | GET, POST | Liste + génération trimestre/année |
| `/api/commune` | GET | Dashboard lecture seule mairie (KPIs, zones, flotte, activité) |

**Pattern action-dispatch engins** : `PATCH /api/engins/[id]` avec `{ action: 'panne'|'maintenance'|'carburant'|'resolve-panne', ...data }`.

**Marquages terrain** : `POST /api/tournees/[id]/marquages` avec `{ abonneId, statut, motif?, motifDetail? }` — upsert, auto-passe la tournée à `en-cours`.

### Paiements (Bictorys)

Configurer `BICTORYS_API_KEY` + `BICTORYS_PRIVATE_KEY` + `BICTORYS_WEBHOOK_SECRET` dans `.env.local`.

Sans ces vars : `/api/pay/[token]` fonctionne en **mode simulation** (succès simulé, pas d'argent réel). Utile pour les démos.

Le webhook Bictorys (`POST /api/webhooks/bictorys`) doit être configuré dans le dashboard Bictorys pour pointer vers `https://your-domain.com/api/webhooks/bictorys`.

### Multi-tenant

Chaque délégataire = 1 `Organization` + 1 `DelegataireProfil`. Tous les objets métier (abonnés, engins, tournées…) sont rattachés à l'`orgId`.

`requireAuth` extrait l'`orgId` du JWT. Toutes les routes métier filtrent par `orgId` — un utilisateur ne voit jamais les données d'une autre organisation.

---

## Modèle de données WasteFlow

```
Organization (1) ──── DelegataireProfil (1)
                              │
                    ┌─────────┼──────────┐
                    │         │          │
                  Zone[]  Engin[]  Consommable[]
                    │
                  Abonne[]
                    │
                ┌───┴───┐
            Paiement[]  Marquage[]
                           │
                       Tournee[]
```

---

## Invariants critiques

- **CSRF** : `verifyCsrf(req)` avant tout handler mutatif (POST/PUT/PATCH/DELETE)
- **Auth** : `requireAuth(req)` sur toutes les routes protégées
- **orgId scope** : filtrer par `orgId` sur tous les modèles métier
- **Montants en XOF entiers** : jamais de décimales (1000 = 1 000 FCFA)
- **Soft delete** : les abonnés sont marqués `actif=false`, jamais supprimés
- **Bictorys webhook** : lire le raw body avant JSON.parse (intégrité HMAC)

---

## Variables d'environnement

Voir `.env.local.example` pour la liste complète. Minimum pour démarrer :
- `DATABASE_URL` + `DIRECT_URL` (Neon Postgres)
- `JWT_SECRET` (≥ 32 chars)
- `ENCRYPTION_KEY` (32 bytes base64)

---

## Seed de développement

```bash
npm run seed
# → crée STADD-GIP-Togo avec 15 abonnés, 3 engins, paiements mai 2026
# Connexion : kofi.mensah@stadd-gip.tg / wasteflow2026
```

---

## Pages et routes

| Route | Description | Statut |
|---|---|---|
| `/login` | Connexion JWT | ✅ réel |
| `/signup` | Création compte délégataire | ✅ réel |
| `/dashboard` | KPIs DSP temps réel | ✅ réel |
| `/abonnes` | Registre abonnés + import CSV | ✅ réel |
| `/abonnes/[id]` | Fiche abonné + historique paiements/passages | ✅ réel |
| `/abonnes/nouveau` | Formulaire création abonné | ✅ réel |
| `/paiements` | Recouvrement consolidé | ✅ réel |
| `/tournees` | Planning hebdomadaire (vue semaine) | ✅ réel |
| `/tournees/terrain` | Saisie terrain mobile (marquages) | ✅ réel |
| `/engins` | Flotte véhicules + signalement panne | ✅ réel |
| `/engins/[id]` | Fiche engin + entretiens + carburant + pannes | ✅ réel |
| `/rapports` | Rapports DSP trimestriels (génération + historique) | ✅ réel |
| `/consommables` | Stocks, alertes seuil, entrées/sorties | ✅ réel |
| `/parametres` | Org, zones, équipe | ✅ réel |
| `/commune` | Vue lecture seule mairie (synthèse, zones, flotte, activité) | ✅ réel |
| `/pay/[token]` | Paiement mobile money abonné | ✅ réel |

---

## Hors scope V1

- GPS tracking temps réel
- App native iOS/Android (PWA uniquement)
- Facturation automatique
- Multi-contrat par délégataire
- Module RH/paie
