import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = process.env.SETUP_PASSWORD ?? 'Admin123!'
  const pwHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email: 'katantchaa@gmail.com' },
    update: { role: 'SUPERADMIN', passwordHash: pwHash, emailVerifiedAt: new Date(), name: 'Tchaa Katansaou' },
    create: { email: 'katantchaa@gmail.com', passwordHash: pwHash, name: 'Tchaa Katansaou', role: 'SUPERADMIN', emailVerifiedAt: new Date() },
  })
  console.log(`✓ Superadmin: ${user.email} (role: ${user.role})`)
  await prisma.$disconnect()
}

main()
