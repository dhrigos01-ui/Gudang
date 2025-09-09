import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}
// FIX: Use `globalThis` instead of `global` for broader environment compatibility.
const prisma = (globalThis as any).prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') (globalThis as any).prisma = prisma;

export default prisma;