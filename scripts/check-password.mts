import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const u = await p.user.findUnique({ where: { email: 'katantchaa@gmail.com' }, select: { id: true, passwordHash: true } });
if (!u) { console.log('USER NOT FOUND'); process.exit(1); }

// Test the password
const match = await bcrypt.compare('Admin123!', u.passwordHash!);
console.log('Admin123! match:', match);

// Test with CRON_SECRET
const cronSecret = process.env.CRON_SECRET;
if (cronSecret) {
  const match2 = await bcrypt.compare(cronSecret, u.passwordHash!);
  console.log('CRON_SECRET match:', match2);
}

await p.$disconnect();
