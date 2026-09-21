import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/lib/apiClient'
import type { Publisher } from '@/lib/types'
import { AddUserForm } from './AddUserForm'

vi.mock('@/lib/apiClient', () => ({ apiFetch: vi.fn() }))

const mockedApiFetch = vi.mocked(apiFetch)

const publishers: Publisher[] = [
  {
    id: 'pub1',
    organizationId: 'org1',
    name: 'The Daily Current',
    slug: 'daily-current',
    domain: 'dailycurrent.com',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('AddUserForm', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  it('submits with no publisher access by default, using the default roles', async () => {
    mockedApiFetch.mockResolvedValue({ userCreated: true })
    const onCreated = vi.fn()
    const user = userEvent.setup()
    render(<AddUserForm organizationId="org1" publishers={publishers} onCreated={onCreated} />)

    await user.type(screen.getByLabelText(/email/i), 'new@northwind.com')
    await user.type(screen.getByLabelText(/^name$/i), 'New User')
    await user.click(screen.getByRole('button', { name: /^add user$/i }))

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/api/organizations/org1/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'new@northwind.com',
          name: 'New User',
          systemRole: 'USER',
          orgRole: 'MEMBER',
          publisherAccess: [],
        }),
      })
    )
    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('includes a selected publisher and toggled permission in the submitted payload', async () => {
    mockedApiFetch.mockResolvedValue({ userCreated: true })
    const user = userEvent.setup()
    render(<AddUserForm organizationId="org1" publishers={publishers} onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'new@northwind.com')
    await user.type(screen.getByLabelText(/^name$/i), 'New User')
    await user.click(screen.getByRole('button', { name: /add publisher access/i }))
    await user.selectOptions(screen.getByLabelText(/^publisher$/i), 'pub1')
    await user.click(screen.getByLabelText(/view dashboard/i))
    await user.click(screen.getByRole('button', { name: /^add user$/i }))

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/api/organizations/org1/users',
      expect.objectContaining({
        body: JSON.stringify({
          email: 'new@northwind.com',
          name: 'New User',
          systemRole: 'USER',
          orgRole: 'MEMBER',
          publisherAccess: [{ publisherId: 'pub1', permissions: ['VIEW_DASHBOARD'] }],
        }),
      })
    )
  })

  it('marks a newly-added access row\'s publisher select as required, so the browser blocks submission until one is chosen', async () => {
    const user = userEvent.setup()
    render(<AddUserForm organizationId="org1" publishers={publishers} onCreated={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /add publisher access/i }))

    expect(screen.getByLabelText(/^publisher$/i)).toBeRequired()
  })

  it('shows the server error message when the request fails', async () => {
    mockedApiFetch.mockRejectedValue(new Error('Carla Nguyen (carla@northwind.com) is already a member of this organization'))
    const user = userEvent.setup()
    render(<AddUserForm organizationId="org1" publishers={publishers} onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'carla@northwind.com')
    await user.type(screen.getByLabelText(/^name$/i), 'Carla Nguyen')
    await user.click(screen.getByRole('button', { name: /^add user$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already a member of this organization/i)
  })
})
