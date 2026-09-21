import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/organizations/:id — organization detail: its publishers, and its
// members with the publisher access/permissions they hold *within this org*.
//
// Every query below is scoped by the :id in the URL, either as the direct
// where clause or as a nested filter (e.g. publisherAccess is filtered down
// to publishers owned by this org). A user can have access grants in other
// orgs — those are never fetched or returned here.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const organization = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      publishers: { orderBy: { name: 'asc' } },
      memberships: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            include: {
              publisherAccess: {
                where: { publisher: { organizationId: params.id } },
                include: { publisher: true, permissions: true },
              },
            },
          },
        },
      },
    },
  })

  if (!organization) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    publishers: organization.publishers,
    users: organization.memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      systemRole: membership.user.systemRole,
      orgRole: membership.role,
      membershipId: membership.id,
      publisherAccess: membership.user.publisherAccess.map((access) => ({
        id: access.id,
        publisherId: access.publisherId,
        publisherName: access.publisher.name,
        permissions: access.permissions.map((p) => p.permission),
      })),
    })),
  })
}
