# CLAUDE.md — WasteFlow

WasteFlow est un SaaS de pilotage de contrats DSP (délégation de service public) pour les PME africaines de collecte des déchets ménagers. Cible initiale : Togo, FCFA (XOF), mobile money Tmoney/Flooz via Bictorys.

Infrastructure adaptée de **izikit** (faratasn-pixel/izikit) : Next.js 16 + Prisma 5 + Neon + JWT auth + Bictorys.

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

| Route | Description |
|---|---|
| `/login` | Connexion JWT |
| `/signup` | Création compte délégataire |
| `/dashboard` | KPIs DSP temps réel |
| `/abonnes` | Registre abonnés |
| `/abonnes/[id]` | Fiche abonné + historique |
| `/abonnes/nouveau` | Formulaire création |
| `/paiements` | Recouvrement consolidé |
| `/tournees` | Planning hebdomadaire |
| `/tournees/terrain` | Saisie terrain (mobile) |
| `/engins` | Flotte véhicules |
| `/engins/[id]` | Fiche engin + maintenance |
| `/rapports` | Rapports DSP + export PDF |
| `/consommables` | Stocks & mouvements |
| `/parametres` | Org, zones, équipe |
| `/commune` | Vue lecture seule mairie |
| `/pay/[token]` | Paiement mobile money abonné |

---

## Hors scope V1

- GPS tracking temps réel
- App native iOS/Android (PWA uniquement)
- Facturation automatique
- Multi-contrat par délégataire
- Module RH/paie
