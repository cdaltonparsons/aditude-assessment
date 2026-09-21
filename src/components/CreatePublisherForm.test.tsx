import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/lib/apiClient'
import { CreatePublisherForm } from './CreatePublisherForm'

vi.mock('@/lib/apiClient', () => ({ apiFetch: vi.fn() }))

const mockedApiFetch = vi.mocked(apiFetch)

describe('CreatePublisherForm', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  it('submits the entered name and domain to the org-scoped publishers endpoint', async () => {
    mockedApiFetch.mockResolvedValue({ id: 'p1' })
    const onCreated = vi.fn()
    const user = userEvent.setup()
    render(<CreatePublisherForm organizationId="org1" onCreated={onCreated} />)

    await user.type(screen.getByLabelText(/name/i), 'Morning Post')
    await user.type(screen.getByLabelText(/domain/i), 'morningpost.com')
    await user.click(screen.getByRole('button', { name: /add publisher/i }))

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/api/organizations/org1/publishers',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Morning Post', domain: 'morningpost.com' }),
      })
    )
    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('clears the form after a successful submission', async () => {
    mockedApiFetch.mockResolvedValue({ id: 'p1' })
    const user = userEvent.setup()
    render(<CreatePublisherForm organizationId="org1" onCreated={vi.fn()} />)

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    await user.type(nameInput, 'Morning Post')
    await user.click(screen.getByRole('button', { name: /add publisher/i }))

    expect(nameInput.value).toBe('')
  })

  it('shows the server error message and does not call onCreated when the request fails', async () => {
    mockedApiFetch.mockRejectedValue(new Error('A publisher with slug "daily-current" already exists in this organization'))
    const onCreated = vi.fn()
    const user = userEvent.setup()
    render(<CreatePublisherForm organizationId="org1" onCreated={onCreated} />)

    await user.type(screen.getByLabelText(/name/i), 'Daily Current')
    await user.click(screen.getByRole('button', { name: /add publisher/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists in this organization/i)
    expect(onCreated).not.toHaveBeenCalled()
  })
})
