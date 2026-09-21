import { PrismaClient } from '@prisma/client'
import { ORG_ROLES, SYSTEM_ROLES, PUBLISHER_PERMISSIONS } from '../src/lib/roles'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.publisherPermission.deleteMany()
  await prisma.publisherAccess.deleteMany()
  await prisma.organizationMembership.deleteMany()
  await prisma.publisher.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // --- Users -----------------------------------------------------------
  const [alice, bob, carla, dev, emi, farid, grace] = await Promise.all([
    prisma.user.create({ data: { email: 'alice@aditude.io', name: 'Alice Chen', systemRole: 'SYSTEM_ADMIN' } }),
    prisma.user.create({ data: { email: 'bob@northwind.com', name: 'Bob Reyes', systemRole: 'USER' } }),
    prisma.user.create({ data: { email: 'carla@northwind.com', name: 'Carla Nguyen', systemRole: 'USER' } }),
    prisma.user.create({ data: { email: 'dev@brightpath.io', name: 'Dev Patel', systemRole: 'USER' } }),
    prisma.user.create({ data: { email: 'emi@brightpath.io', name: 'Emi Sato', systemRole: 'USER' } }),
    prisma.user.create({ data: { email: 'farid@lumen.media', name: 'Farid Haidari', systemRole: 'USER' } }),
    prisma.user.create({ data: { email: 'grace@lumen.media', name: 'Grace Okafor', systemRole: 'USER' } }),
  ])

  // --- Organizations -----------------------------------------------------
  const northwind = await prisma.organization.create({
    data: { name: 'Northwind Media', slug: 'northwind-media' },
  })
  const brightpath = await prisma.organization.create({
    data: { name: 'Brightpath Network', slug: 'brightpath-network' },
  })
  const lumen = await prisma.organization.create({
    data: { name: 'Lumen Digital', slug: 'lumen-digital' },
  })

  // --- Publishers ----------------------------------------------------------
  const [nwDaily, nwWeekly] = await Promise.all([
    prisma.publisher.create({
      data: { organizationId: northwind.id, name: 'The Daily Current', slug: 'daily-current', domain: 'dailycurrent.com' },
    }),
    prisma.publisher.create({
      data: { organizationId: northwind.id, name: 'Weekly Ledger', slug: 'weekly-ledger', domain: 'weeklyledger.com' },
    }),
  ])

  const [bpTech, bpLife] = await Promise.all([
    prisma.publisher.create({
      data: { organizationId: brightpath.id, name: 'Brightpath Tech', slug: 'brightpath-tech', domain: 'brightpathtech.io' },
    }),
    prisma.publisher.create({
      data: { organizationId: brightpath.id, name: 'Brightpath Life', slug: 'brightpath-life', domain: 'brightpathlife.io', status: 'INACTIVE' },
    }),
  ])

  const lumenMain = await prisma.publisher.create({
    data: { organizationId: lumen.id, name: 'Lumen Insights', slug: 'lumen-insights', domain: 'lumeninsights.media' },
  })

  // --- Organization memberships -------------------------------------------
  await Promise.all([
    // Alice is a platform-level system admin who also owns Northwind's org record
    prisma.organizationMembership.create({ data: { userId: alice.id, organizationId: northwind.id, role: 'OWNER' } }),

    prisma.organizationMembership.create({ data: { userId: bob.id, organizationId: northwind.id, role: 'ADMIN' } }),
    prisma.organizationMembership.create({ data: { userId: carla.id, organizationId: northwind.id, role: 'MEMBER' } }),

    prisma.organizationMembership.create({ data: { userId: dev.id, organizationId: brightpath.id, role: 'OWNER' } }),
    prisma.organizationMembership.create({ data: { userId: emi.id, organizationId: brightpath.id, role: 'MEMBER' } }),

    prisma.organizationMembership.create({ data: { userId: farid.id, organizationId: lumen.id, role: 'OWNER' } }),
    prisma.organizationMembership.create({ data: { userId: grace.id, organizationId: lumen.id, role: 'MEMBER' } }),
    // Carla also consults for Brightpath — demonstrates a user belonging to multiple orgs
    prisma.organizationMembership.create({ data: { userId: carla.id, organizationId: brightpath.id, role: 'MEMBER' } }),
  ])

  // --- Publisher access + permissions --------------------------------------
  async function grantAccess(userId: string, publisherId: string, permissions: string[]) {
    const access = await prisma.publisherAccess.create({ data: { userId, publisherId } })
    await prisma.publisherPermission.createMany({
      data: permissions.map((permission) => ({ publisherAccessId: access.id, permission })),
    })
  }

  await grantAccess(bob.id, nwDaily.id, ['VIEW_DASHBOARD', 'MANAGE_CAMPAIGNS', 'MANAGE_USERS'])
  await grantAccess(bob.id, nwWeekly.id, ['VIEW_DASHBOARD', 'MANAGE_CAMPAIGNS'])
  await grantAccess(carla.id, nwDaily.id, ['VIEW_DASHBOARD'])

  await grantAccess(dev.id, bpTech.id, ['VIEW_DASHBOARD', 'MANAGE_CAMPAIGNS', 'MANAGE_USERS', 'MANAGE_BILLING'])
  await grantAccess(emi.id, bpTech.id, ['VIEW_DASHBOARD', 'MANAGE_CAMPAIGNS'])
  await grantAccess(emi.id, bpLife.id, ['VIEW_DASHBOARD'])
  await grantAccess(carla.id, bpTech.id, ['VIEW_DASHBOARD'])

  await grantAccess(farid.id, lumenMain.id, ['VIEW_DASHBOARD', 'MANAGE_CAMPAIGNS', 'MANAGE_USERS', 'MANAGE_BILLING'])
  await grantAccess(grace.id, lumenMain.id, ['VIEW_DASHBOARD', 'MANAGE_CAMPAIGNS'])

  console.log('Seed complete.')
  console.log({ ORG_ROLES, SYSTEM_ROLES, PUBLISHER_PERMISSIONS })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
