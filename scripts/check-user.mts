// @ts-check
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const u = await p.user.findUnique({ where: { email: 'katantchaa@gmail.com' }, select: { id: true, email: true, role: true, passwordHash: true, tokenVersion: true, status: true } });
if (u) {
  console.log('USER FOUND:', JSON.stringify({ ...u, passwordHash: u.passwordHash ? u.passwordHash.substring(0,20)+'...' : null }, null, 2));
} else {
  console.log('USER NOT FOUND');
}
const orgMember = await p.organizationMember.findFirst({ where: { userId: u?.id } });
if (orgMember) console.log('ORG MEMBER:', JSON.stringify(orgMember, null, 2));
else console.log('NO ORG MEMBERSHIP');
await p.$disconnect();
