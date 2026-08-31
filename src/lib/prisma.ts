import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Prisma 7 yêu cầu driver adapter; SQLite dùng better-sqlite3.
if (!process.env.DATABASE_URL) {
  process.loadEnvFile(path.join(process.cwd(), '.env'))
}

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
  })

// Giữ 1 instance duy nhất giữa các lần hot-reload của Next ở môi trường dev.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> }

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
