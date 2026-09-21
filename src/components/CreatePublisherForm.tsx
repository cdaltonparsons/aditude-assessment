'use client'

import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'

export function CreatePublisherForm({
  organizationId,
  onCreated,
}: {
  organizationId: string
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await apiFetch(`/api/organizations/${organizationId}/publishers`, {
        method: 'POST',
        body: JSON.stringify({ name, domain: domain.trim() || undefined }),
      })
      setName('')
      setDomain('')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create publisher')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="publisher-name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="publisher-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="publisher-domain" className="block text-sm font-medium text-slate-700">
          Domain <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          id="publisher-domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add publisher'}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  )
}
