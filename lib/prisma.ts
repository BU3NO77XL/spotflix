import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const dbFile = dbUrl.replace(/^file:/, '');
const dbPath = path.resolve(process.cwd(), dbFile);

const adapter = new PrismaBetterSqlite3({ url: dbPath });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
