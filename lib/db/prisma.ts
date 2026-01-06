import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Vercel Postgres uses different env var names
// Priority: DATABASE_URL > POSTGRES_PRISMA_URL > POSTGRES_URL
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL
  return undefined
}

const databaseUrl = getDatabaseUrl()

// Configure Prisma Client with appropriate settings for Vercel
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: databaseUrl ? {
    db: {
      url: databaseUrl
    }
  } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma