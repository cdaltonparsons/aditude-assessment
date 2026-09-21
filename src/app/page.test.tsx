import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/lib/apiClient'
import HomePage from './page'

vi.mock('@/lib/apiClient', () => ({ apiFetch: vi.fn() }))

const mockedApiFetch = vi.mocked(apiFetch)

const orgs = [
  { id: 'org1', name: 'Northwind Media', slug: 'northwind-media', createdAt: '2026-01-01', publisherCount: 2, memberCount: 3 },
  { id: 'org2', name: 'Lumen Digital', slug: 'lumen-digital', createdAt: '2026-01-01', publisherCount: 1, memberCount: 2 },
]

describe('HomePage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  it('shows a loading state before the organizations arrive', () => {
    mockedApiFetch.mockReturnValue(new Promise(() => {})) // never resolves
    render(<HomePage />)

    expect(screen.getByRole('status')).toHaveTextContent(/loading organizations/i)
  })

  it('renders each organization as a link to its detail page, with counts', async () => {
    mockedApiFetch.mockResolvedValue(orgs)
    render(<HomePage />)

    expect(await screen.findByRole('link', { name: /northwind media/i })).toHaveAttribute('href', '/organizations/org1')
    expect(screen.getByText('2 publishers · 3 members')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /lumen digital/i })).toHaveAttribute('href', '/organizations/org2')
  })

  it('shows an empty state when there are no organizations', async () => {
    mockedApiFetch.mockResolvedValue([])
    render(<HomePage />)

    expect(await screen.findByText(/no organizations yet/i)).toBeInTheDocument()
  })

  it('shows a retryable error banner when the fetch fails, and refetches on retry', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('Failed to load organizations'))
    const user = userEvent.setup()
    render(<HomePage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load organizations/i)

    mockedApiFetch.mockResolvedValueOnce(orgs)
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByRole('link', { name: /northwind media/i })).toBeInTheDocument()
    expect(mockedApiFetch).toHaveBeenCalledTimes(2)
  })
})
