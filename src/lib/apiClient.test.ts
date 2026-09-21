import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './apiClient'

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on a successful response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'Northwind' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiFetch('/api/organizations/1')

    expect(result).toEqual({ id: '1', name: 'Northwind' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/organizations/1',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    )
  })

  it('throws the server-provided error message on a failed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'A user with email "x@x.com" already exists' }),
      })
    )

    await expect(apiFetch('/api/organizations/1/users', { method: 'POST' })).rejects.toThrow(
      'A user with email "x@x.com" already exists'
    )
  })

  it('falls back to a status-based message when the body has no error field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve(null),
      })
    )

    await expect(apiFetch('/api/organizations')).rejects.toThrow('Request failed with status 500')
  })
})
