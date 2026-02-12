import { PrismaClient } from '@prisma/client'

// Singleton do Prisma Client
let prisma: PrismaClient | null = null

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error']
    })
  }
  return prisma
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

// Exporta o cliente diretamente para uso simplificado
export const db = getDatabase()
