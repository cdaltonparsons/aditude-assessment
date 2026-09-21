'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiClient'
import { AddUserForm } from '@/components/AddUserForm'
import { CreatePublisherForm } from '@/components/CreatePublisherForm'
import { ErrorBanner } from '@/components/ErrorBanner'
import { LoadingState } from '@/components/LoadingState'
import { formatLabel } from '@/lib/format'
import type { OrganizationDetail } from '@/lib/types'

export default function OrganizationPage({ params }: { params: { id: string } }) {
  const [org, setOrg] = useState<OrganizationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publisherFormOpen, setPublisherFormOpen] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch<OrganizationDetail>(`/api/organizations/${params.id}`)
      .then(setOrg)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load organization'))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingState label="Loading organization…" />
  if (error) return <ErrorBanner message={error} onRetry={load} />
  if (!org) return null

  return (
    <div className="space-y-10">
      <div>
        <Link href="/" className="text-sm text-blue-700 hover:underline">
          ← All organizations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{org.name}</h1>
        <p className="text-sm text-slate-500">
          Slug: {org.slug} · Created {new Date(org.createdAt).toLocaleDateString()}
        </p>
      </div>

      <section aria-labelledby="publishers-heading" className="space-y-4">
        <h2 id="publishers-heading" className="text-lg font-semibold text-slate-900">
          Publishers
        </h2>

        {org.publishers.length === 0 ? (
          <p className="text-sm text-slate-500">No publishers yet.</p>
        ) : (
          <ul role="list" className="grid gap-3 sm:grid-cols-2">
            {org.publishers.map((publisher) => (
              <li key={publisher.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{publisher.name}</p>
                <p className="text-sm text-slate-500">{publisher.domain ?? 'No domain set'}</p>
                <span
                  className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                    publisher.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {publisher.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg border border-slate-200 p-4">
          <button
            type="button"
            aria-expanded={publisherFormOpen}
            aria-controls="add-publisher-panel"
            onClick={() => setPublisherFormOpen((open) => !open)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-700"
          >
            Add a publisher
            <span aria-hidden="true" className="text-slate-400">
              {publisherFormOpen ? '−' : '+'}
            </span>
          </button>
          {publisherFormOpen && (
            <div id="add-publisher-panel" className="mt-4">
              <CreatePublisherForm organizationId={org.id} onCreated={load} />
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="users-heading" className="space-y-4">
        <h2 id="users-heading" className="text-lg font-semibold text-slate-900">
          Users
        </h2>

        {org.users.length === 0 ? (
          <p className="text-sm text-slate-500">No users yet.</p>
        ) : (
          <ul role="list" className="space-y-3">
            {org.users.map((user) => (
              <li key={user.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {formatLabel(user.orgRole)}
                    </span>
                    {user.systemRole === 'SYSTEM_ADMIN' && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        {formatLabel(user.systemRole)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Publisher access</p>
                  {user.publisherAccess.length === 0 ? (
                    <p className="text-sm text-slate-500">No publisher access granted.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {user.publisherAccess.map((access) => (
                        <li key={access.id} className="text-sm text-slate-700">
                          <span className="font-medium">{access.publisherName}</span>:{' '}
                          {access.permissions.length > 0
                            ? access.permissions.map(formatLabel).join(', ')
                            : 'No permissions granted'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg border border-slate-200 p-4">
          <button
            type="button"
            aria-expanded={userFormOpen}
            aria-controls="add-user-panel"
            onClick={() => setUserFormOpen((open) => !open)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-700"
          >
            Add a user
            <span aria-hidden="true" className="text-slate-400">
              {userFormOpen ? '−' : '+'}
            </span>
          </button>
          {userFormOpen && (
            <div id="add-user-panel" className="mt-4">
              <AddUserForm organizationId={org.id} publishers={org.publishers} onCreated={load} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
