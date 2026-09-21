import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/apiError'

// POST /api/organizations/:id/publishers — create a publisher under this org.
// The org id always comes from the URL, never the request body, so a caller
// cannot create a publisher under an org they didn't navigate to.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'A publisher name is required' }, { status: 400 })
  }

  const name: string = body.name.trim()
  const slug: string =
    typeof body.slug === 'string' && body.slug.trim()
      ? body.slug.trim().toLowerCase()
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const domain: string | null = typeof body.domain === 'string' && body.domain.trim() ? body.domain.trim() : null

  if (!slug) {
    return NextResponse.json({ error: 'Could not derive a valid slug from the name' }, { status: 400 })
  }

  // Checked and created inside one transaction (not a pre-check on `prisma`
  // followed by a separate write) so a concurrent delete of this org between
  // the check and the write can't produce an unhandled FK error instead of a
  // clean 404.
  try {
    const publisher = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.findUnique({ where: { id: params.id } })
      if (!organization) {
        throw new ApiError(404, 'Organization not found')
      }
      return tx.publisher.create({ data: { organizationId: params.id, name, slug, domain } })
    })
    return NextResponse.json(publisher, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: `A publisher with slug "${slug}" already exists in this organization` }, { status: 409 })
    }
    throw error
  }
}
