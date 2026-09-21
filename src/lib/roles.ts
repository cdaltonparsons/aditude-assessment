// Single source of truth for the string-typed "enum" fields on the Prisma
// models. SQLite has no native enum support, so these are plain strings at
// the DB layer — this module is what keeps the API and UI honest about
// which values are valid.

export const SYSTEM_ROLES = ['USER', 'SYSTEM_ADMIN'] as const
export type SystemRole = (typeof SYSTEM_ROLES)[number]

export const ORG_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const
export type OrgRole = (typeof ORG_ROLES)[number]

export const PUBLISHER_PERMISSIONS = [
  'VIEW_DASHBOARD',
  'MANAGE_CAMPAIGNS',
  'MANAGE_USERS',
  'MANAGE_BILLING',
] as const
export type PublisherPermission = (typeof PUBLISHER_PERMISSIONS)[number]

export function isSystemRole(value: string): value is SystemRole {
  return (SYSTEM_ROLES as readonly string[]).includes(value)
}

export function isOrgRole(value: string): value is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(value)
}

export function isPublisherPermission(value: string): value is PublisherPermission {
  return (PUBLISHER_PERMISSIONS as readonly string[]).includes(value)
}
