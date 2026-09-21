'use client'

import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { formatLabel } from '@/lib/format'
import { ORG_ROLES, PUBLISHER_PERMISSIONS, SYSTEM_ROLES } from '@/lib/roles'
import type { Publisher } from '@/lib/types'

type AccessRow = { publisherId: string; permissions: string[] }

export function AddUserForm({
  organizationId,
  publishers,
  onCreated,
}: {
  organizationId: string
  publishers: Publisher[]
  onCreated: () => void
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [systemRole, setSystemRole] = useState<string>('USER')
  const [orgRole, setOrgRole] = useState<string>('MEMBER')
  const [accessRows, setAccessRows] = useState<AccessRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addAccessRow() {
    setAccessRows((rows) => [...rows, { publisherId: '', permissions: [] }])
  }

  function updateRowPublisher(index: number, publisherId: string) {
    setAccessRows((rows) => rows.map((row, i) => (i === index ? { ...row, publisherId } : row)))
  }

  function togglePermission(index: number, permission: string) {
    setAccessRows((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row
        const has = row.permissions.includes(permission)
        return {
          ...row,
          permissions: has ? row.permissions.filter((p) => p !== permission) : [...row.permissions, permission],
        }
      })
    )
  }

  function removeRow(index: number) {
    setAccessRows((rows) => rows.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    // No need to check for empty accessRows.publisherId here: each row's
    // <select required> already blocks the browser from firing the submit
    // event at all until every row has a publisher chosen.
    setSubmitting(true)
    try {
      await apiFetch(`/api/organizations/${organizationId}/users`, {
        method: 'POST',
        body: JSON.stringify({ email, name, systemRole, orgRole, publisherAccess: accessRows }),
      })
      setEmail('')
      setName('')
      setSystemRole('USER')
      setOrgRole('MEMBER')
      setAccessRows([])
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="user-email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="user-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            If this email already belongs to a user, they&apos;ll be added to this org instead of creating a duplicate.
          </p>
        </div>
        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="user-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="user-system-role" className="block text-sm font-medium text-slate-700">
            System role
          </label>
          <select
            id="user-system-role"
            value={systemRole}
            onChange={(e) => setSystemRole(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {SYSTEM_ROLES.map((role) => (
              <option key={role} value={role}>
                {formatLabel(role)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="user-org-role" className="block text-sm font-medium text-slate-700">
            Organization role
          </label>
          <select
            id="user-org-role"
            value={orgRole}
            onChange={(e) => setOrgRole(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {ORG_ROLES.map((role) => (
              <option key={role} value={role}>
                {formatLabel(role)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="rounded border border-slate-200 p-3">
        <legend className="px-1 text-sm font-medium text-slate-700">Publisher access</legend>
        {accessRows.length === 0 && <p className="text-sm text-slate-500">No publisher access granted yet.</p>}
        <div className="space-y-3">
          {accessRows.map((row, index) => (
            <div key={index} className="rounded border border-slate-200 p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label htmlFor={`access-publisher-${index}`} className="block text-sm font-medium text-slate-700">
                    Publisher
                  </label>
                  <select
                    id={`access-publisher-${index}`}
                    required
                    value={row.publisherId}
                    onChange={(e) => updateRowPublisher(index, e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select a publisher</option>
                    {publishers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              <fieldset className="mt-2">
                <legend className="text-xs font-medium uppercase text-slate-500">Permissions</legend>
                <div className="mt-1 flex flex-wrap gap-3">
                  {PUBLISHER_PERMISSIONS.map((permission) => (
                    <label key={permission} className="flex items-center gap-1.5 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={row.permissions.includes(permission)}
                        onChange={() => togglePermission(index, permission)}
                      />
                      {formatLabel(permission)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          ))}
        </div>
        <button type="button" onClick={addAccessRow} className="mt-3 text-sm font-medium text-blue-700 hover:underline">
          + Add publisher access
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add user'}
      </button>
    </form>
  )
}
