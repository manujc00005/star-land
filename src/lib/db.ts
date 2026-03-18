import { PrismaClient } from "@prisma/client"

// Singleton para evitar múltiples instancias de PrismaClient en desarrollo (hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
