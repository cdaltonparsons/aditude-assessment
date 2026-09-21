import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/lib/apiClient'
import type { OrganizationDetail } from '@/lib/types'
import OrganizationPage from './page'

vi.mock('@/lib/apiClient', () => ({ apiFetch: vi.fn() }))

const mockedApiFetch = vi.mocked(apiFetch)

const org: OrganizationDetail = {
  id: 'org1',
  name: 'Northwind Media',
  slug: 'northwind-media',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  publishers: [
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
  ],
  users: [
    {
      id: 'user1',
      name: 'Bob Reyes',
      email: 'bob@northwind.com',
      systemRole: 'USER',
      orgRole: 'ADMIN',
      membershipId: 'mem1',
      publisherAccess: [
        { id: 'acc1', publisherId: 'pub1', publisherName: 'The Daily Current', permissions: ['VIEW_DASHBOARD', 'MANAGE_CAMPAIGNS'] },
      ],
    },
    {
      id: 'user2',
      name: 'Alice Chen',
      email: 'alice@aditude.io',
      systemRole: 'SYSTEM_ADMIN',
      orgRole: 'OWNER',
      membershipId: 'mem2',
      publisherAccess: [],
    },
  ],
}

describe('OrganizationPage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  it('shows a loading state before the org detail arrives', () => {
    mockedApiFetch.mockReturnValue(new Promise(() => {}))
    render(<OrganizationPage params={{ id: 'org1' }} />)

    expect(screen.getByRole('status')).toHaveTextContent(/loading organization/i)
  })

  it('renders org metadata, publishers, and each user with their formatted publisher access', async () => {
    mockedApiFetch.mockResolvedValue(org)
    render(<OrganizationPage params={{ id: 'org1' }} />)

    expect(await screen.findByRole('heading', { name: 'Northwind Media' })).toBeInTheDocument()
    expect(screen.getByText(/slug: northwind-media/i)).toBeInTheDocument()

    const publishersSection = screen.getByRole('heading', { name: 'Publishers' }).closest('section')!
    expect(within(publishersSection).getByText('The Daily Current')).toBeInTheDocument()
    expect(within(publishersSection).getByText('ACTIVE')).toBeInTheDocument()

    const bobRow = screen.getByText('Bob Reyes').closest('li')!
    expect(within(bobRow).getByText('Admin')).toBeInTheDocument()
    expect(within(bobRow).getByText(/view dashboard, manage campaigns/i)).toBeInTheDocument()

    const aliceRow = screen.getByText('Alice Chen').closest('li')!
    expect(within(aliceRow).getByText('System Admin')).toBeInTheDocument()
    expect(within(aliceRow).getByText(/no publisher access granted/i)).toBeInTheDocument()

    // the correct org id from the dynamic route param was requested, not a hardcoded one
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/organizations/org1')
  })

  it('shows a retryable error banner when the fetch fails', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('Organization not found'))
    const user = userEvent.setup()
    render(<OrganizationPage params={{ id: 'does-not-exist' }} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/organization not found/i)

    mockedApiFetch.mockResolvedValueOnce(org)
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByRole('heading', { name: 'Northwind Media' })).toBeInTheDocument()
  })

  it('passes this org\'s publishers into the add-user form for the publisher-access picker', async () => {
    mockedApiFetch.mockResolvedValue(org)
    const user = userEvent.setup()
    render(<OrganizationPage params={{ id: 'org1' }} />)

    await screen.findByRole('heading', { name: 'Northwind Media' })
    const addUserToggle = screen.getByRole('button', { name: /^add a user$/i })
    expect(addUserToggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(addUserToggle)
    expect(addUserToggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: /add publisher access/i }))

    expect(within(screen.getByLabelText(/^publisher$/i)).getByText('The Daily Current')).toBeInTheDocument()
  })
})
