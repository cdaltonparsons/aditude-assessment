import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/organizations — list all organizations for the org switcher.
// Intentionally returns only aggregate counts, not member/publisher detail,
// so this endpoint doesn't leak one org's user list to another.
export async function GET() {
  const organizations = await prisma.organization.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { publishers: true, memberships: true } },
    },
  })

  return NextResponse.json(
    organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      publisherCount: org._count.publishers,
      memberCount: org._count.memberships,
    }))
  )
}
