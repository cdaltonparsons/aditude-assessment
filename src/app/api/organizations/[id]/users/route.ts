import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isOrgRole, isPublisherPermission, isSystemRole } from '@/lib/roles'
import { grantPublisherAccess } from '@/lib/publisherAccess'
import { ApiError } from '@/lib/apiError'

type PublisherAccessInput = { publisherId: string; permissions: string[] }

// POST /api/organizations/:id/users — add a user to this org with a role,
// and (optionally) grant publisher access + permissions in one request.
//
// A user is standalone and can belong to multiple orgs (per README), so
// email is used as a find-or-create key: if a user with this email already
// exists, they're attached to this org rather than rejected as a conflict.
// `name`/`systemRole` are only applied when creating a brand-new user —
// systemRole is a global attribute of the user, so silently changing it for
// an existing user as a side effect of an "add to org" call would be a
// surprising privilege change visible in every other org they belong to.
// Promoting/demoting an existing user is a separate action, out of scope here.
//
// Everything below the initial lookup happens in one transaction so a
// partial failure can't leave a newly-created user with no membership, or a
// membership with no access grants.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.email !== 'string' || !body.email.trim()) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'A name is required' }, { status: 400 })
  }

  const email: string = body.email.trim().toLowerCase()
  const name: string = body.name.trim()
  const systemRole: string = body.systemRole ?? 'USER'
  const orgRole: string = body.orgRole ?? 'MEMBER'

  if (!isSystemRole(systemRole)) {
    return NextResponse.json({ error: `Invalid systemRole "${systemRole}"` }, { status: 400 })
  }
  if (!isOrgRole(orgRole)) {
    return NextResponse.json({ error: `Invalid orgRole "${orgRole}"` }, { status: 400 })
  }

  const publisherAccessInput: PublisherAccessInput[] = Array.isArray(body.publisherAccess) ? body.publisherAccess : []
  const seenPublisherIds = new Set<string>()
  for (const grant of publisherAccessInput) {
    if (!grant || typeof grant.publisherId !== 'string') {
      return NextResponse.json({ error: 'Each publisherAccess entry needs a publisherId' }, { status: 400 })
    }
    if (seenPublisherIds.has(grant.publisherId)) {
      return NextResponse.json({ error: `Duplicate publisherAccess entry for publisher "${grant.publisherId}"` }, { status: 400 })
    }
    seenPublisherIds.add(grant.publisherId)

    const permissions = Array.isArray(grant.permissions) ? grant.permissions : []
    const seenPermissions = new Set<string>()
    for (const permission of permissions) {
      if (!isPublisherPermission(permission)) {
        return NextResponse.json({ error: `Invalid permission "${permission}"` }, { status: 400 })
      }
      if (seenPermissions.has(permission)) {
        return NextResponse.json(
          { error: `Duplicate permission "${permission}" for publisher "${grant.publisherId}"` },
          { status: 400 }
        )
      }
      seenPermissions.add(permission)
    }
  }

  // Every check below reads and writes through the same `tx` handle, inside
  // one transaction — not a pre-check on `prisma` followed by a separate
  // write. Checking on the bare client first and writing afterward leaves a
  // window where another request can delete/consume what was just verified
  // to exist (TOCTOU); reading through `tx` closes it, since SQLite holds a
  // lock for this connection from its first statement until commit.
  try {
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.findUnique({ where: { id: params.id } })
      if (!organization) {
        throw new ApiError(404, 'Organization not found')
      }

      // Every publisher the caller wants to grant access to must belong to
      // *this* org — otherwise a request against org A could silently grant
      // access to org B's publisher.
      if (publisherAccessInput.length > 0) {
        const publisherIds = publisherAccessInput.map((g) => g.publisherId)
        const validPublishers = await tx.publisher.findMany({
          where: { id: { in: publisherIds }, organizationId: params.id },
          select: { id: true },
        })
        const validIds = new Set(validPublishers.map((p) => p.id))
        const invalidId = publisherIds.find((id) => !validIds.has(id))
        if (invalidId) {
          throw new ApiError(400, `Publisher "${invalidId}" does not belong to this organization`)
        }
      }

      const existingUser = await tx.user.findUnique({ where: { email } })

      if (existingUser) {
        const existingMembership = await tx.organizationMembership.findUnique({
          where: { userId_organizationId: { userId: existingUser.id, organizationId: params.id } },
        })
        if (existingMembership) {
          throw new ApiError(409, `${existingUser.name} (${email}) is already a member of this organization`)
        }

        if (publisherAccessInput.length > 0) {
          const existingAccess = await tx.publisherAccess.findFirst({
            where: { userId: existingUser.id, publisherId: { in: publisherAccessInput.map((g) => g.publisherId) } },
            include: { publisher: true },
          })
          if (existingAccess) {
            throw new ApiError(409, `${existingUser.name} already has access to publisher "${existingAccess.publisher.name}"`)
          }
        }
      }

      const user = existingUser ?? (await tx.user.create({ data: { email, name, systemRole } }))

      const membership = await tx.organizationMembership.create({
        data: { userId: user.id, organizationId: params.id, role: orgRole },
      })

      for (const grant of publisherAccessInput) {
        await grantPublisherAccess(tx, {
          userId: user.id,
          publisherId: grant.publisherId,
          permissions: Array.isArray(grant.permissions) ? grant.permissions : [],
        })
      }

      return { user, membership, userCreated: !existingUser }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? (error.meta.target as string[]) : []
      if (target.includes('email')) {
        return NextResponse.json({ error: `A user with email "${email}" already exists` }, { status: 409 })
      }
      // Pre-checks above should make these unreachable outside a concurrent
      // request racing this one, but don't misreport the cause if they fire.
      return NextResponse.json({ error: 'A conflicting record already exists for this request' }, { status: 409 })
    }
    throw error
  }
}
