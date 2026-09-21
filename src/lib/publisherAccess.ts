import { Prisma, PrismaClient } from '@prisma/client'
import { ApiError } from './apiError'

type DbClient = Prisma.TransactionClient | PrismaClient

export class MembershipRequiredError extends ApiError {
  constructor(
    readonly userId: string,
    readonly organizationId: string
  ) {
    super(409, `User "${userId}" must be a member of organization "${organizationId}" before being granted publisher access`)
    this.name = 'MembershipRequiredError'
  }
}

export class PublisherNotFoundError extends ApiError {
  constructor(readonly publisherId: string) {
    super(404, `Publisher "${publisherId}" does not exist`)
    this.name = 'PublisherNotFoundError'
  }
}

// The schema can't express "a PublisherAccess row's user must be a member of
// the org that owns the publisher" — SQLite has no cross-table constraints,
// so Prisma has nothing to enforce it either. This function is the single
// enforcement point instead: every code path that grants publisher access
// MUST go through it rather than calling `publisherAccess.create` directly,
// so the invariant holds even for write paths added later that don't happen
// to bundle membership creation into the same call.
export async function grantPublisherAccess(
  db: DbClient,
  { userId, publisherId, permissions }: { userId: string; publisherId: string; permissions: string[] }
) {
  const publisher = await db.publisher.findUnique({ where: { id: publisherId } })
  if (!publisher) {
    throw new PublisherNotFoundError(publisherId)
  }

  const membership = await db.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId: publisher.organizationId } },
  })
  if (!membership) {
    throw new MembershipRequiredError(userId, publisher.organizationId)
  }

  const access = await db.publisherAccess.create({ data: { userId, publisherId } })
  if (permissions.length > 0) {
    await db.publisherPermission.createMany({
      data: permissions.map((permission) => ({ publisherAccessId: access.id, permission })),
    })
  }
  return access
}
