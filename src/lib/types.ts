export type OrganizationSummary = {
  id: string
  name: string
  slug: string
  createdAt: string
  publisherCount: number
  memberCount: number
}

export type Publisher = {
  id: string
  organizationId: string
  name: string
  slug: string
  domain: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export type PublisherAccessSummary = {
  id: string
  publisherId: string
  publisherName: string
  permissions: string[]
}

export type OrganizationUser = {
  id: string
  name: string
  email: string
  systemRole: string
  orgRole: string
  membershipId: string
  publisherAccess: PublisherAccessSummary[]
}

export type OrganizationDetail = {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  publishers: Publisher[]
  users: OrganizationUser[]
}
