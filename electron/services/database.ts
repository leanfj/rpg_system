import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

// Singleton do Prisma Client
let prisma: PrismaClient | null = null

export function getDatabase(): PrismaClient {
  if (!prisma) {
    const isDev = !app.isPackaged
    const userDataDir = app.getPath('userData')
    const userDbPath = path.join(userDataDir, 'rpg_sessions.db')
    const templateDbCandidates = isDev
      ? [
          path.join(app.getAppPath(), 'database', 'rpg_sessions.db'),
          path.join(app.getAppPath(), 'database', 'rpg_session.db')
        ]
      : [
          path.join(process.resourcesPath, 'database', 'rpg_sessions.db'),
          path.join(process.resourcesPath, 'database', 'rpg_session.db')
        ]
    const templateDbPath = templateDbCandidates.find((candidate) => fs.existsSync(candidate))
    let dbPath = isDev ? (templateDbPath ?? userDbPath) : userDbPath

    if (isDev) {
      if (!fs.existsSync(dbPath) && fs.existsSync(userDbPath)) {
        dbPath = userDbPath
      }
    } else {
      const userDbExists = fs.existsSync(userDbPath)
      const userDbHasData = userDbExists && fs.statSync(userDbPath).size > 0

      if (!userDbHasData) {
        fs.mkdirSync(userDataDir, { recursive: true })
        if (templateDbPath) {
          fs.copyFileSync(templateDbPath, userDbPath)
        }
      }
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`
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
