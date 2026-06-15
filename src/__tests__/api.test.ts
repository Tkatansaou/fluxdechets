// ─── Tests — API Client (src/lib/api.ts) ─────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Simple cookie simulation
let cookieStore = ''
const mockDoc: Record<string, any> = {}

let origWindow: unknown

import { api, ApiError, storeCsrfToken, clearCsrfToken } from '@/lib/api'

beforeEach(() => {
  cookieStore = ''
  mockFetch.mockReset()
  origWindow = (globalThis as any).window
  ;(globalThis as any).window = { location: { protocol: 'http:' } }
  // Set up document with getter/setter
  Object.defineProperty(globalThis, 'document', {
    value: {
      get cookie() { return cookieStore },
      set cookie(value: string) {
        if (value.includes('max-age=0')) {
          cookieStore = ''
        } else {
          const name = value.split('=')[0]
          const existing = cookieStore.split(';').filter(c => c.trim() !== '' && !c.trim().startsWith(name + '='))
          existing.push(value)
          cookieStore = existing.join('; ')
        }
      },
    },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  ;(globalThis as any).window = origWindow
})

describe('storeCsrfToken / clearCsrfToken', () => {
  it('stores a CSRF cookie', () => {
    storeCsrfToken('test-token-123')
    expect(document.cookie).toContain('wf-csrf=')
    expect(document.cookie).toContain('test-token-123')
  })

  it('clears CSRF cookie', () => {
    storeCsrfToken('test-token')
    clearCsrfToken()
    expect(document.cookie).not.toContain('test-token')
  })
})

describe('ApiError', () => {
  it('creates error with status and typed code', () => {
    const err = new ApiError(401, 'Unauthorized', { error: 'INVALID_CREDENTIALS' })
    expect(err.status).toBe(401)
    expect(err.message).toBe('Unauthorized')
    expect(err.code).toBe('INVALID_CREDENTIALS')
    expect(err.name).toBe('ApiError')
  })

  it('handles missing error code', () => {
    const err = new ApiError(500, 'Server Error')
    expect(err.code).toBe('')
  })
})

describe('api function', () => {
  it('sends request with credentials and returns JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    })

    const result = await api('/api/test')
    expect(result).toEqual({ data: 'test' })

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/test')
    expect(opts.method).toBe('GET')
    expect(opts.credentials).toBe('include')
  })

  it('throws ApiError on 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ error: 'UNAUTHORIZED' })),
    })

    await expect(api('/api/protected')).rejects.toThrow(ApiError)
    await expect(api('/api/protected')).rejects.toMatchObject({ status: 401 })
  })

  it('sends POST with JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    })

    await api('/api/data', { method: 'POST', body: { key: 'value' } })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(opts.headers['Content-Type']).toBe('application/json')
    expect(opts.body).toBe(JSON.stringify({ key: 'value' }))
  })

  it('throws network error on timeout-like AbortError', async () => {
    mockFetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    try {
      await api('/api/test')
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(0)
    }
  })

  it('includes CSRF token header on POST when token exists', async () => {
    storeCsrfToken('my-csrf-value')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    })

    await api('/api/data', { method: 'POST' })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.headers['x-csrf-token']).toBe('my-csrf-value')
  })

  it('does not include CSRF on GET', async () => {
    storeCsrfToken('my-csrf-value')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    })

    await api('/api/data')

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.headers['x-csrf-token']).toBeUndefined()
  })
})
