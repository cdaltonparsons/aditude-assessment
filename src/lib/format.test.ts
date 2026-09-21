import { describe, expect, it } from 'vitest'
import { formatLabel } from './format'

describe('formatLabel', () => {
  it('converts SCREAMING_SNAKE_CASE to Title Case', () => {
    expect(formatLabel('VIEW_DASHBOARD')).toBe('View Dashboard')
    expect(formatLabel('MANAGE_CAMPAIGNS')).toBe('Manage Campaigns')
  })

  it('handles single-word values', () => {
    expect(formatLabel('OWNER')).toBe('Owner')
  })

  it('does not mutate the input value', () => {
    const input = 'SYSTEM_ADMIN'
    formatLabel(input)
    expect(input).toBe('SYSTEM_ADMIN')
  })
})
