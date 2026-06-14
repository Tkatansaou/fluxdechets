import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find user
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'katantchaa' } },
        { email: { contains: 'tchaa' } },
        { email: { contains: 'kata' } },
      ],
    },
    select: { id: true, email: true, name: true, role: true, status: true },
  })

  console.log('Users found:', users.length)
  users.forEach(u => {
    console.log(`  - ${u.email} | role: ${u.role} | status: ${u.status} | name: ${u.name}`)
  })

  // If katantchaa@gmail.com found, reset password
  const target = users.find(u => u.email === 'katantchaa@gmail.com')
  if (target) {
    console.log('\n=== Resetting password and promoting to SUPERADMIN ===')
    
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.default.hash('Admin123!', 12)
    
    await prisma.user.update({
      where: { id: target.id },
      data: {
        passwordHash: hash,
        role: 'SUPERADMIN',
        tokenVersion: { increment: 1 },
      },
    })
    
    console.log(`✅ User ${target.email} updated:`)
    console.log(`   Role: USER → SUPERADMIN`)
    console.log(`   Password: Admin123!`)
    console.log(`   Token version incremented (existing sessions invalidated)`)
  } else {
    // Create user
    console.log('\n=== Creating SUPERADMIN user ===')
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.default.hash('Admin123!', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'katantchaa@gmail.com',
        passwordHash: hash,
        name: 'Tchaa Katansaou',
        role: 'SUPERADMIN',
        emailVerifiedAt: new Date(),
      },
    })
    
    console.log(`✅ Superadmin created:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: Admin123!`)
  }

  // Count all users
  const total = await prisma.user.count()
  console.log(`\nTotal users in DB: ${total}`)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
