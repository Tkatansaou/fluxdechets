// ─── Tests — Export CSV ──────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { toCsv, csvHeaders, escapeCsvField } from '@/lib/server/export'

describe('escapeCsvField', () => {
  it('returns simple values as-is', () => {
    expect(escapeCsvField('hello')).toBe('hello')
  })

  it('wraps values with commas in quotes', () => {
    expect(escapeCsvField('hello, world')).toBe('"hello, world"')
  })

  it('escapes double quotes', () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""')
  })
})

describe('toCsv', () => {
  it('generates CSV with BOM and header', () => {
    const rows = [
      { name: 'John', age: '30' },
      { name: 'Jane', age: '25' },
    ]
    const cols = [
      { key: 'name', label: 'Nom' },
      { key: 'age', label: 'Âge' },
    ]
    const csv = toCsv(rows, cols)
    expect(csv.startsWith('\uFEFF')).toBe(true) // BOM
    expect(csv).toContain('Nom,Âge')
    expect(csv).toContain('John,30')
    expect(csv).toContain('Jane,25')
    expect(csv).toContain('\r\n')
  })

  it('handles empty rows', () => {
    const csv = toCsv([], [{ key: 'id', label: 'ID' }])
    expect(csv).toBe('\uFEFFID')
  })

  it('escapes fields with special chars', () => {
    const rows = [{ note: 'hello, world' }]
    const csv = toCsv(rows, [{ key: 'note', label: 'Note' }])
    expect(csv).toContain('"hello, world"')
  })
})

describe('csvHeaders', () => {
  it('returns proper Content-Type and Content-Disposition', () => {
    const headers = csvHeaders('test.csv')
    expect(headers['Content-Type']).toBe('text/csv; charset=utf-8')
    expect(headers['Content-Disposition']).toBe('attachment; filename="test.csv"')
  })
})
