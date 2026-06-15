// ─── Tests — Validation Zod (schemas utilisés dans les API) ──────────────────

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Reproduce the schemas from the API routes (they're local, not exported)
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  orgName: z.string().min(2),
  commune: z.string().min(2),
  typeOrg: z.enum(['delegataire', 'mairie']).default('delegataire'),
})

const createAbonneSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  telephone: z.string().min(8),
  adresse: z.string().optional(),
  zoneId: z.string(),
  frequenceCollecte: z.enum(['hebdomadaire', 'bi-hebdomadaire']).default('bi-hebdomadaire'),
})

const paySchema = z.object({
  operateur: z.enum(['tmoney', 'flooz', 'moov']),
  telephone: z.string().min(8).optional(),
})

const createEnginSchema = z.object({
  immatriculation: z.string().min(2),
  type: z.enum(['tricycle', 'camion-benne', 'charrette']),
  marque: z.string().optional(),
  modele: z.string().optional(),
  annee: z.number().int().min(1990).max(2030).optional(),
  statut: z.enum(['opérationnel', 'en-panne', 'en-maintenance']).default('opérationnel'),
  kilometrage: z.number().int().min(0).default(0),
})

describe('Login schema', () => {
  it('accepts valid input', () => {
    expect(loginSchema.safeParse({ email: 'test@example.com', password: 'secret' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false)
  })
})

describe('Signup schema', () => {
  it('accepts valid signup', () => {
    const result = signupSchema.safeParse({
      email: 'org@example.com',
      password: 'longenough',
      nom: 'Doe',
      prenom: 'John',
      orgName: 'Ma Société',
      commune: 'Lomé',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.typeOrg).toBe('delegataire') // default
    }
  })

  it('rejects short password', () => {
    expect(signupSchema.safeParse({
      email: 'org@example.com',
      password: 'short',
      nom: 'Doe', prenom: 'John',
      orgName: 'Ma Société', commune: 'Lomé',
    }).success).toBe(false)
  })

  it('accepts mairie type', () => {
    expect(signupSchema.safeParse({
      email: 'mairie@example.com',
      password: 'longenough',
      nom: 'Maire', prenom: 'Le',
      orgName: 'Mairie de Vo', commune: 'Vo',
      typeOrg: 'mairie',
    }).success).toBe(true)
  })
})

describe('Create abonné schema', () => {
  it('accepts valid abonné', () => {
    expect(createAbonneSchema.safeParse({
      nom: 'Doe', prenom: 'John',
      telephone: '90123456', zoneId: 'abc123',
    }).success).toBe(true)
  })

  it('rejects short telephone', () => {
    expect(createAbonneSchema.safeParse({
      nom: 'Doe', prenom: 'John',
      telephone: '123', zoneId: 'abc123',
    }).success).toBe(false)
  })
})

describe('Pay schema', () => {
  it('accepts tmoney', () => {
    expect(paySchema.safeParse({ operateur: 'tmoney' }).success).toBe(true)
  })

  it('accepts moov', () => {
    expect(paySchema.safeParse({ operateur: 'moov' }).success).toBe(true)
  })

  it('rejects invalid operator', () => {
    expect(paySchema.safeParse({ operateur: 'orange-money' }).success).toBe(false)
  })
})

describe('Create engin schema', () => {
  it('accepts valid engin', () => {
    expect(createEnginSchema.safeParse({
      immatriculation: 'AB-123-CD',
      type: 'tricycle',
    }).success).toBe(true)
  })

  it('rejects invalid type', () => {
    expect(createEnginSchema.safeParse({
      immatriculation: 'AB-123-CD',
      type: 'voiture',
    }).success).toBe(false)
  })
})
