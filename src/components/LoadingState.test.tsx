import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingState } from './LoadingState'

describe('LoadingState', () => {
  it('renders the label inside a status region', () => {
    render(<LoadingState label="Loading organizations…" />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading organizations…')
  })
})
