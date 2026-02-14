import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

// Singleton do Prisma Client
let prisma: PrismaClient | null = null

export function getDatabase(): PrismaClient {
  if (!prisma) {
    const userDataDir = app.getPath('userData')
    const userDbPath = path.join(userDataDir, 'rpg_sessions.db')
    const templateDbPath = path.join(app.getAppPath(), 'database', 'rpg_sessions.db')

    if (!fs.existsSync(userDbPath)) {
      fs.mkdirSync(userDataDir, { recursive: true })
      if (fs.existsSync(templateDbPath)) {
        fs.copyFileSync(templateDbPath, userDbPath)
      }
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${userDbPath}`
        }
      },
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
