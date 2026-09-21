import { describe, expect, it } from 'vitest'
import { isOrgRole, isPublisherPermission, isSystemRole, ORG_ROLES, PUBLISHER_PERMISSIONS, SYSTEM_ROLES } from './roles'

describe('isSystemRole', () => {
  it('accepts every declared system role', () => {
    for (const role of SYSTEM_ROLES) {
      expect(isSystemRole(role)).toBe(true)
    }
  })

  it('rejects unknown or lowercase values', () => {
    expect(isSystemRole('SUPERUSER')).toBe(false)
    expect(isSystemRole('user')).toBe(false)
    expect(isSystemRole('')).toBe(false)
  })
})

describe('isOrgRole', () => {
  it('accepts every declared org role', () => {
    for (const role of ORG_ROLES) {
      expect(isOrgRole(role)).toBe(true)
    }
  })

  it('rejects values outside the declared set', () => {
    expect(isOrgRole('SUPER_OWNER')).toBe(false)
  })
})

describe('isPublisherPermission', () => {
  it('accepts every declared permission', () => {
    for (const permission of PUBLISHER_PERMISSIONS) {
      expect(isPublisherPermission(permission)).toBe(true)
    }
  })

  it('rejects values outside the declared set', () => {
    expect(isPublisherPermission('DELETE_EVERYTHING')).toBe(false)
  })
})
