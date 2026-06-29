import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const dbFile = dbUrl.replace(/^file:/, '');
const dbPath = path.resolve(process.cwd(), dbFile);

const adapter = new PrismaBetterSqlite3({ url: dbPath });

export const prisma = new PrismaClient({ adapter });
