import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const user = await prisma.user.findUnique({
  where: { email: 'kofi.mensah@stadd-gip.tg' },
  select: { id: true, email: true, passwordHash: true, status: true },
})

console.log('User found:', user ? 'YES' : 'NO')
if (user) {
  console.log('Status:', user.status)
  console.log('Has hash:', !!user.passwordHash)
  const match = await bcrypt.compare('wasteflow2026', user.passwordHash ?? '')
  console.log('Password match:', match)
} else {
  console.log('❌ User not in DB!')
}

await prisma.$disconnect()
