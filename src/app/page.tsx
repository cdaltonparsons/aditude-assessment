'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiClient'
import { ErrorBanner } from '@/components/ErrorBanner'
import { LoadingState } from '@/components/LoadingState'
import type { OrganizationSummary } from '@/lib/types'

export default function HomePage() {
  const [orgs, setOrgs] = useState<OrganizationSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch<OrganizationSummary[]>('/api/organizations')
      .then(setOrgs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load organizations'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingState label="Loading organizations…" />
  if (error) return <ErrorBanner message={error} onRetry={load} />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Organizations</h1>

      {orgs && orgs.length === 0 ? (
        <p className="text-sm text-slate-500">No organizations yet.</p>
      ) : (
        <ul role="list" className="grid gap-4 sm:grid-cols-2">
          {orgs?.map((org) => (
            <li key={org.id}>
              <Link
                href={`/organizations/${org.id}`}
                className="block rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                <p className="font-medium text-slate-900">{org.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {org.publisherCount} publisher{org.publisherCount === 1 ? '' : 's'} · {org.memberCount} member
                  {org.memberCount === 1 ? '' : 's'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
