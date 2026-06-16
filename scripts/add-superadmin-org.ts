import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'katantchaa@gmail.com' } })
  const org = await prisma.organization.findUnique({ where: { slug: 'stadd-gip-togo' } })
  
  if (!user) { console.log('User not found'); return }
  if (!org) { console.log('Org not found'); return }

  const membership = await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: { role: 'OWNER' },
    create: { organizationId: org.id, userId: user.id, role: 'OWNER' },
  })
  console.log(`✓ Membership: ${user.email} → ${org.name} (${membership.role})`)
  await prisma.$disconnect()
}

main()
