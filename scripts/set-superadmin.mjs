// One-shot script: promote a user to SUPERADMIN
// Usage: npx tsx scripts/set-superadmin.mjs <email>
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const EMAIL = process.argv[2] || 'katantchaa@gmail.com'

try {
  const user = await prisma.user.update({
    where: { email: EMAIL },
    data: { role: 'SUPERADMIN' },
    select: { id: true, email: true, role: true },
  })
  console.log('✓ Promoted:', user.email, '→', user.role)
} catch (err) {
  console.error('❌ Error:', err instanceof Error ? err.message : err)
} finally {
  await prisma.$disconnect()
}
