export const runtime = 'nodejs'
// GET /api/docs/openapi.json — Spécification OpenAPI 3.0 de l'API WasteFlow

import { NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxdechets.com'

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'WasteFlow API',
    version: '1.0.0',
    description: `API REST de WasteFlow — Plateforme de pilotage DSP pour délégataires de collecte de déchets solides au Togo.

## Authentification
Les endpoints protégés utilisent des cookies HttpOnly (JWT access/refresh).
Le token CSRF est requis pour les mutations (header \`x-csrf-token\`).

## Paiements
Deux providers de mobile money sont supportés :
- **Moneroo** (prioritaire) : Tmoney, Flooz, Moov
- **Bictorys** (fallback) : Tmoney, Flooz
`,
    contact: {
      name: 'WasteFlow Support',
      url: APP_URL,
    },
  },
  servers: [
    { url: APP_URL, description: 'Production' },
    { url: 'http://localhost:3000', description: 'Local' },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Connexion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@organisation.tg' },
                  password: { type: 'string', format: 'password', example: '••••••••' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Connexion réussie — cookies JWT + CSRF définis' },
          '401': { description: 'Identifiants invalides' },
          '429': { description: 'Trop de tentatives' },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Authentification'],
        summary: 'Créer un compte organisation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  nom: { type: 'string' },
                  prenom: { type: 'string' },
                  orgName: { type: 'string', description: "Nom de l'organisation" },
                  commune: { type: 'string' },
                  typeOrg: { type: 'string', enum: ['delegataire', 'mairie'] },
                },
                required: ['email', 'password', 'nom', 'prenom', 'orgName', 'commune'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Compte créé' },
          '422': { description: 'Validation échouée' },
          '429': { description: 'Trop de tentatives' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentification'],
        summary: 'Profil utilisateur courant',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Profil utilisateur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string', nullable: true },
                        role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPERADMIN'] },
                        orgId: { type: 'string' },
                        orgName: { type: 'string' },
                        typeOrg: { type: 'string', enum: ['delegataire', 'mairie'] },
                        commune: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/kpis': {
      get: {
        tags: ['Dashboard'],
        summary: 'KPI dashboard',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Indicateurs clés + alertes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    kpis: {
                      type: 'object',
                      properties: {
                        abonnesActifs: { type: 'integer' },
                        tauxRecouvrement: { type: 'integer' },
                        tauxCollecte: { type: 'integer' },
                        enginsOperationnels: { type: 'integer' },
                        enginsTotal: { type: 'integer' },
                        encaisseMoisMontant: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/abonnes': {
      get: {
        tags: ['Abonnés'],
        summary: 'Liste des abonnés (paginate)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Recherche' },
          { name: 'statut', in: 'query', schema: { type: 'string' } },
          { name: 'zoneId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Liste des abonnés' },
        },
      },
      post: {
        tags: ['Abonnés'],
        summary: 'Créer un abonné',
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        responses: {
          '201': { description: 'Abonné créé' },
          '409': { description: 'Téléphone en doublon' },
        },
      },
    },
    '/api/paiements': {
      get: {
        tags: ['Paiements'],
        summary: 'Liste des paiements',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'mois', in: 'query', schema: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } },
        ],
        responses: { '200': { description: 'Liste des paiements' } },
      },
    },
    '/api/tournees': {
      get: {
        tags: ['Tournées'],
        summary: 'Liste des tournées',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Liste des tournées' } },
      },
      post: {
        tags: ['Tournées'],
        summary: 'Planifier une tournée',
        security: [{ cookieAuth: [] }, { csrfToken: [] }],
        responses: { '201': { description: 'Tournée créée' } },
      },
    },
    '/api/engins': {
      get: {
        tags: ['Engins'],
        summary: 'Liste des engins',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Liste des engins' } },
      },
    },
    '/api/employes': {
      get: {
        tags: ['Employés'],
        summary: 'Liste des employés',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Liste des employés' } },
      },
    },
    '/api/consommables': {
      get: {
        tags: ['Consommables'],
        summary: 'Stock consommables',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Liste des consommables' } },
      },
    },
    '/api/export': {
      get: {
        tags: ['Export'],
        summary: 'Export CSV des données',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: ['abonnes', 'paiements', 'tournees', 'engins', 'employes'] },
          },
        ],
        responses: {
          '200': { description: 'Fichier CSV' },
        },
      },
    },
    '/api/zones': {
      get: {
        tags: ['Zones'],
        summary: 'Liste des zones de collecte',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Liste des zones' } },
      },
    },
    '/api/rapports': {
      get: {
        tags: ['Rapports'],
        summary: 'Rapports DSP trimestriels',
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Liste des rapports' } },
      },
    },
    '/api/health': {
      get: {
        tags: ['Système'],
        summary: 'Health check',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Authentification'],
        summary: 'Demander un email de réinitialisation',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { email: { type: 'string', format: 'email' } },
                required: ['email'],
              },
            },
          },
        },
        responses: { '200': { description: 'Email envoyé si le compte existe' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentification'],
        summary: 'Réinitialiser le mot de passe',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', description: 'Token reçu par email' },
                  password: { type: 'string', minLength: 8 },
                },
                required: ['token', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Mot de passe réinitialisé' },
          '400': { description: 'Token invalide ou expiré' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'wf-access',
        description: 'Cookie JWT access token (httpOnly, défini automatiquement après login)',
      },
      csrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'x-csrf-token',
        description: 'Token CSRF (cookie wf-csrf, requis pour les mutations)',
      },
    },
  },
  tags: [
    { name: 'Authentification', description: 'Connexion, inscription, gestion de session' },
    { name: 'Dashboard', description: 'KPI et indicateurs temps réel' },
    { name: 'Abonnés', description: 'Gestion des abonnés (CRUD)' },
    { name: 'Paiements', description: 'Historique des paiements' },
    { name: 'Tournées', description: 'Planification et suivi des collectes' },
    { name: 'Engins', description: 'Gestion du parc de véhicules' },
    { name: 'Employés', description: 'Gestion du personnel' },
    { name: 'Zones', description: 'Zones de collecte' },
    { name: 'Consommables', description: 'Gestion des stocks' },
    { name: 'Rapports', description: 'Rapports trimestriels DSP' },
    { name: 'Export', description: 'Export CSV' },
    { name: 'Système', description: 'Endpoints système (health, etc.)' },
  ],
}

export async function GET() {
  return NextResponse.json(spec)
}
