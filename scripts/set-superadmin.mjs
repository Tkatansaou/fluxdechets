// One-shot script: promote a user to SUPERADMIN
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const EMAIL = 'katantchaa@gmail.com'

const user = await prisma.user.update({
  where: { email: EMAIL },
  data: { role: 'SUPERADMIN' },
  select: { id: true, email: true, role: true },
})

console.log('✓ Promoted:', user)
await prisma.$disconnect()
