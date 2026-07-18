// ─── Tests unitaires — Utilitaires WasteFlow ─────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  formatFCFA,
  formatDate,
  cn,
  calculTauxRecouvrement,
  formatTelephone,
  getCurrentMonth,
  getPreviousMonths,
  truncate,
  initiales,
  nomComplet,
  generateReference,
} from '@/lib/utils'

describe('formatFCFA', () => {
  it('formats zero', () => {
    expect(formatFCFA(0)).toBe('0 FCFA')
  })

  it('formats small amounts', () => {
    expect(formatFCFA(1000)).toBe('1 000 FCFA')
  })

  it('formats large amounts', () => {
    expect(formatFCFA(1_000_000)).toBe('1 000 000 FCFA')
  })
})

describe('formatDate', () => {
  it('formats ISO date to dd/MM/yyyy', () => {
    expect(formatDate('2026-06-15')).toBe('15/06/2026')
  })

  it('returns raw string on invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('handles ISO datetime strings', () => {
    expect(formatDate('2026-06-01T10:30:00.000Z')).toBe('01/06/2026')
  })
})

describe('cn', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('handles conditional classes', () => {
    const isHidden = false
    expect(cn('text-red-500', isHidden && 'hidden', 'font-bold')).toBe('text-red-500 font-bold')
  })
})

describe('calculTauxRecouvrement', () => {
  it('returns 0 for empty list', () => {
    expect(calculTauxRecouvrement([])).toBe(0)
  })

  it('returns 100 when all are à-jour', () => {
    const abonnes = [
      { statut: 'à-jour', actif: true },
      { statut: 'à-jour', actif: true },
    ]
    expect(calculTauxRecouvrement(abonnes)).toBe(100)
  })

  it('excludes inactive abonnes from denominator', () => {
    const abonnes = [
      { statut: 'à-jour', actif: true },
      { statut: 'impayé', actif: false },
    ]
    expect(calculTauxRecouvrement(abonnes)).toBe(100)
  })

  it('calculates partial rate', () => {
    const abonnes = [
      { statut: 'à-jour', actif: true },
      { statut: 'impayé', actif: true },
      { statut: 'en-retard', actif: true },
      { statut: 'à-jour', actif: true },
    ]
    expect(calculTauxRecouvrement(abonnes)).toBe(50)
  })
})

describe('formatTelephone', () => {
  it('formats Togolese numbers', () => {
    expect(formatTelephone('22890123456')).toBe('+228 90 12 34 56')
  })

  it('passes through other formats', () => {
    expect(formatTelephone('+233501234567')).toBe('+233501234567')
  })
})

describe('getCurrentMonth', () => {
  it('returns YYYY-MM format', () => {
    const month = getCurrentMonth()
    expect(month).toMatch(/^\d{4}-\d{2}$/)
  })
})

describe('getPreviousMonths', () => {
  it('returns N previous months', () => {
    const months = getPreviousMonths(3)
    expect(months).toHaveLength(3)
    months.forEach(m => expect(m).toMatch(/^\d{4}-\d{2}$/))
  })
})

describe('truncate', () => {
  it('returns full string if shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world this is long', 10)).toBe('hello worl…')
  })
})

describe('nomComplet / initiales', () => {
  it('combines prenom and nom', () => {
    expect(nomComplet({ nom: 'Doe', prenom: 'John' })).toBe('John Doe')
  })

  it('extracts initials', () => {
    expect(initiales({ nom: 'Doe', prenom: 'John' })).toBe('JD')
  })
})

describe('generateReference', () => {
  it('starts with WF prefix', () => {
    expect(generateReference()).toMatch(/^WF/)
  })
})
