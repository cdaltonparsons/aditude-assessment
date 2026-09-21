import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBanner } from './ErrorBanner'

describe('ErrorBanner', () => {
  it('renders the message inside an alert region', () => {
    render(<ErrorBanner message="Failed to load organizations" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load organizations')
  })

  it('does not render a retry button when onRetry is not provided', () => {
    render(<ErrorBanner message="Failed" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorBanner message="Failed" onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
