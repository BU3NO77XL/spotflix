import { PrismaClient as PrismaClientSqlite } from '@/lib/generated/prisma/client';
import { PrismaClient as PrismaClientPg } from '@/lib/generated/prisma-pg/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isSqlite = dbUrl.startsWith('file:');

type PrismaClientType = PrismaClientSqlite;

function createClient(): PrismaClientType {
  if (isSqlite) {
    const dbFile = dbUrl.replace(/^file:/, '');
    const dbPath = path.resolve(process.cwd(), dbFile);
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    return new PrismaClientSqlite({ adapter }) as unknown as PrismaClientType;
  }

  // PostgreSQL (Supabase) — PrismaPg aceita string (connection string)
  const adapter = new PrismaPg(dbUrl);
  return new PrismaClientPg({ adapter }) as unknown as PrismaClientType;
}

export const prisma = createClient();
