import { app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, shell } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '../services/database'
import { 
  startRecording, 
  stopRecording, 
  sendAudioChunk,
  checkSTTHealth 
} from '../services/audio'

/**
 * Registra todos os IPC handlers.
 * Cada handler segue o padrão: 'dominio:acao'
 * 
 * Esta arquitetura facilita:
 * - Testes unitários
 * - Separação de responsabilidades
 * - Manutenção
 */

// Tipos auxiliares
type Handler<T = unknown, R = unknown> = (event: IpcMainInvokeEvent, ...args: T[]) => Promise<R>

const dmShieldFiles = [
  'escudo_mestre_1.md',
  'escudo_mestre_2.md',
  'escudo_mestre_3.md'
]

let dmShieldWindow: BrowserWindow | null = null
let dmShieldAlwaysOnTop = false

const resolveDmShieldFile = async (fileName: string): Promise<string | null> => {
  const basePaths = [app.getAppPath(), process.resourcesPath]

  for (const basePath of basePaths) {
    const candidate = path.join(basePath, fileName)
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // Continue searching next base path.
    }
  }

  return null
}

const parseDmShieldTitle = (content: string, fallback: string): string => {
  const match = content.match(/^#\s+(.+)$/m)
  if (match) {
    return match[1].trim()
  }
  return fallback
}

const createDmShieldWindow = (): BrowserWindow => {
  const shieldWindow = new BrowserWindow({
    width: 560,
    height: 720,
    minWidth: 420,
    minHeight: 540,
    title: 'Escudo do Mestre',
    backgroundColor: '#13172b',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const isDev = !app.isPackaged

  if (isDev) {
    shieldWindow.loadURL('http://localhost:5173/#/dm-shield')
  } else {
    shieldWindow.loadFile(path.join(app.getAppPath(), 'renderer', 'dist', 'index.html'), {
      hash: '/dm-shield'
    })
  }

  shieldWindow.setAlwaysOnTop(dmShieldAlwaysOnTop)

  shieldWindow.once('ready-to-show', () => {
    shieldWindow.show()
  })

  shieldWindow.on('closed', () => {
    dmShieldWindow = null
  })

  return shieldWindow
}

// === Campanhas ===
ipcMain.handle('campaigns:getAll', async () => {
  return await db.campaign.findMany({
    orderBy: { createdAt: 'desc' }
  })
})

ipcMain.handle('campaigns:create', async (_event, name: string) => {
  return await db.campaign.create({ 
    data: { name } 
  })
})

ipcMain.handle('campaigns:delete', async (_event, id: string) => {
  await db.campaign.delete({ where: { id } })
  return true
})

// === Sessões ===
ipcMain.handle('sessions:getAll', async () => {
  return await db.session.findMany({
    include: { campaign: true },
    orderBy: { startedAt: 'desc' }
  })
})

ipcMain.handle('sessions:start', async (_event, campaignId: string) => {
  return await db.session.create({
    data: { campaignId }
  })
})

ipcMain.handle('sessions:stop', async (_event, sessionId: string) => {
  await db.session.update({
    where: { id: sessionId },
    data: { endedAt: new Date() }
  })
  return true
})

ipcMain.handle('sessions:delete', async (_event, sessionId: string) => {
  await db.session.delete({ where: { id: sessionId } })
  return true
})

ipcMain.handle('sessions:updateStatus', async (_event, sessionId: string, status: string) => {
  return await db.session.update({
    where: { id: sessionId },
    data: { status }
  })
})

ipcMain.handle('sessions:getByCampaign', async (_event, campaignId: string) => {
  return await db.session.findMany({
    where: { campaignId },
    orderBy: { startedAt: 'desc' }
  })
})

// === Personagens jogadores ===
ipcMain.handle('players:getByCampaign', async (_event, campaignId: string) => {
  return await db.playerCharacter.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' }
  })
})

// === NPCs ===
ipcMain.handle('npcs:getByCampaign', async (_event, campaignId: string) => {
  return await db.npc.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' }
  })
})

ipcMain.handle('npcs:create', async (_event, data: {
  campaignId: string
  name: string
  race?: string
  occupation?: string
  location?: string
  tags?: string
  notes?: string
}) => {
  return await db.npc.create({ data })
})

ipcMain.handle('npcs:update', async (_event, id: string, data: {
  name: string
  race?: string
  occupation?: string
  location?: string
  tags?: string
  notes?: string
}) => {
  return await db.npc.update({
    where: { id },
    data
  })
})

ipcMain.handle('npcs:delete', async (_event, id: string) => {
  await db.npc.delete({ where: { id } })
  return true
})

// === Quests ===
ipcMain.handle('quests:getByCampaign', async (_event, campaignId: string) => {
  return await db.quest.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' }
  })
})

ipcMain.handle('quests:create', async (_event, data: {
  campaignId: string
  title: string
  status: string
  objective?: string
  reward?: string
  notes?: string
}) => {
  return await db.quest.create({ data })
})

ipcMain.handle('quests:update', async (_event, id: string, data: {
  title: string
  status: string
  objective?: string
  reward?: string
  notes?: string
}) => {
  return await db.quest.update({
    where: { id },
    data
  })
})

ipcMain.handle('quests:delete', async (_event, id: string) => {
  await db.quest.delete({ where: { id } })
  return true
})

// === Anotacoes do mestre ===
ipcMain.handle('masterNotes:getByCampaign', async (_event, campaignId: string) => {
  return await db.masterNote.findUnique({
    where: { campaignId }
  })
})

ipcMain.handle('masterNotes:save', async (_event, data: {
  campaignId: string
  content: string
}) => {
  return await db.masterNote.upsert({
    where: { campaignId: data.campaignId },
    create: { campaignId: data.campaignId, content: data.content },
    update: { content: data.content }
  })
})

// === Locais ===
ipcMain.handle('locations:getByCampaign', async (_event, campaignId: string) => {
  return await db.location.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' }
  })
})

ipcMain.handle('locations:create', async (_event, data: {
  campaignId: string
  name: string
  description?: string
  status?: string
  notes?: string
}) => {
  return await db.location.create({ data })
})

ipcMain.handle('locations:update', async (_event, id: string, data: {
  name: string
  description?: string
  status?: string
  notes?: string
}) => {
  return await db.location.update({
    where: { id },
    data
  })
})

ipcMain.handle('locations:delete', async (_event, id: string) => {
  await db.location.delete({ where: { id } })
  return true
})

// === Eventos narrativos ===
ipcMain.handle('storyEvents:getByCampaign', async (_event, campaignId: string) => {
  return await db.storyEvent.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' }
  })
})

ipcMain.handle('storyEvents:create', async (_event, data: {
  campaignId: string
  title: string
  description?: string
  status?: string
  impact?: string
}) => {
  return await db.storyEvent.create({ data })
})

ipcMain.handle('storyEvents:update', async (_event, id: string, data: {
  title: string
  description?: string
  status?: string
  impact?: string
}) => {
  return await db.storyEvent.update({
    where: { id },
    data
  })
})

ipcMain.handle('storyEvents:delete', async (_event, id: string) => {
  await db.storyEvent.delete({ where: { id } })
  return true
})

// === Notas de sessao ===
ipcMain.handle('sessionNotes:getBySession', async (_event, sessionId: string) => {
  return await db.sessionNote.findMany({
    where: { sessionId },
    include: {
      npcs: { include: { npc: true } },
      players: { include: { player: true } },
      quests: { include: { quest: true } },
      locations: { include: { location: true } },
      events: { include: { event: true } }
    },
    orderBy: [{ phase: 'asc' }, { order: 'asc' }]
  })
})

ipcMain.handle('sessionNotes:getByCampaign', async (_event, campaignId: string) => {
  return await db.sessionNote.findMany({
    where: {
      session: { campaignId }
    },
    include: {
      session: { select: { id: true, title: true, startedAt: true } },
      npcs: { include: { npc: true } },
      players: { include: { player: true } },
      quests: { include: { quest: true } },
      locations: { include: { location: true } },
      events: { include: { event: true } }
    },
    orderBy: [{ session: { startedAt: 'desc' } }, { phase: 'asc' }, { order: 'asc' }]
  })
})

ipcMain.handle('sessionNotes:create', async (_event, data: {
  sessionId: string
  phase: string
  content: string
  importance?: string
  order?: number
  connections?: {
    npcIds?: string[]
    playerIds?: string[]
    questIds?: string[]
    locationIds?: string[]
    eventIds?: string[]
  }
}) => {
  const { connections, ...noteData } = data
  
  const note = await db.sessionNote.create({
    data: noteData,
    include: {
      npcs: { include: { npc: true } },
      players: { include: { player: true } },
      quests: { include: { quest: true } },
      locations: { include: { location: true } },
      events: { include: { event: true } }
    }
  })

  // Cria conexoes
  if (connections) {
    if (connections.npcIds) {
      await Promise.all(
        connections.npcIds.map((npcId) =>
          db.sessionNoteNpc.create({
            data: { sessionNoteId: note.id, npcId }
          })
        )
      )
    }
    if (connections.playerIds) {
      await Promise.all(
        connections.playerIds.map((playerId) =>
          db.sessionNotePlayer.create({
            data: { sessionNoteId: note.id, playerId }
          })
        )
      )
    }
    if (connections.questIds) {
      await Promise.all(
        connections.questIds.map((questId) =>
          db.sessionNoteQuest.create({
            data: { sessionNoteId: note.id, questId }
          })
        )
      )
    }
    if (connections.locationIds) {
      await Promise.all(
        connections.locationIds.map((locationId) =>
          db.sessionNoteLocation.create({
            data: { sessionNoteId: note.id, locationId }
          })
        )
      )
    }
    if (connections.eventIds) {
      await Promise.all(
        connections.eventIds.map((eventId) =>
          db.sessionNoteEvent.create({
            data: { sessionNoteId: note.id, eventId }
          })
        )
      )
    }
  }

  // Retorna nota com conexoes
  return await db.sessionNote.findUnique({
    where: { id: note.id },
    include: {
      npcs: { include: { npc: true } },
      players: { include: { player: true } },
      quests: { include: { quest: true } },
      locations: { include: { location: true } },
      events: { include: { event: true } }
    }
  })
})

ipcMain.handle('sessionNotes:update', async (_event, id: string, data: {
  content?: string
  importance?: string
  order?: number
  connections?: {
    npcIds?: string[]
    playerIds?: string[]
    questIds?: string[]
    locationIds?: string[]
    eventIds?: string[]
  }
}) => {
  const { connections, ...noteData } = data

  // Atualiza nota
  await db.sessionNote.update({
    where: { id },
    data: noteData
  })

  // Atualiza conexoes se fornecidas
  if (connections) {
    // Remove conexoes antigas
    await Promise.all([
      db.sessionNoteNpc.deleteMany({ where: { sessionNoteId: id } }),
      db.sessionNotePlayer.deleteMany({ where: { sessionNoteId: id } }),
      db.sessionNoteQuest.deleteMany({ where: { sessionNoteId: id } }),
      db.sessionNoteLocation.deleteMany({ where: { sessionNoteId: id } }),
      db.sessionNoteEvent.deleteMany({ where: { sessionNoteId: id } })
    ])

    // Cria novas conexoes
    if (connections.npcIds) {
      await Promise.all(
        connections.npcIds.map((npcId) =>
          db.sessionNoteNpc.create({
            data: { sessionNoteId: id, npcId }
          })
        )
      )
    }
    if (connections.playerIds) {
      await Promise.all(
        connections.playerIds.map((playerId) =>
          db.sessionNotePlayer.create({
            data: { sessionNoteId: id, playerId }
          })
        )
      )
    }
    if (connections.questIds) {
      await Promise.all(
        connections.questIds.map((questId) =>
          db.sessionNoteQuest.create({
            data: { sessionNoteId: id, questId }
          })
        )
      )
    }
    if (connections.locationIds) {
      await Promise.all(
        connections.locationIds.map((locationId) =>
          db.sessionNoteLocation.create({
            data: { sessionNoteId: id, locationId }
          })
        )
      )
    }
    if (connections.eventIds) {
      await Promise.all(
        connections.eventIds.map((eventId) =>
          db.sessionNoteEvent.create({
            data: { sessionNoteId: id, eventId }
          })
        )
      )
    }
  }

  // Retorna nota atualizada com conexoes
  return await db.sessionNote.findUnique({
    where: { id },
    include: {
      npcs: { include: { npc: true } },
      players: { include: { player: true } },
      quests: { include: { quest: true } },
      locations: { include: { location: true } },
      events: { include: { event: true } }
    }
  })
})

ipcMain.handle('sessionNotes:delete', async (_event, id: string) => {
  await db.sessionNote.delete({ where: { id } })
  return true
})

// === Midia ===
ipcMain.handle('media:pickAudioFiles', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Audio',
        extensions: ['mp3', 'wav', 'ogg', 'webm']
      }
    ]
  })

  if (result.canceled) return []
  return result.filePaths
})

ipcMain.handle('media:readAudioFile', async (_event, filePath: string) => {
  const data = await fs.readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm'
  }
  return {
    data,
    mimeType: mimeMap[ext] || 'audio/mpeg'
  }
})

// === Monitoramento de turnos ===
ipcMain.handle('turnMonitor:getByCampaign', async (_event, campaignId: string) => {
  return await db.turnMonitor.findUnique({
    where: { campaignId }
  })
})

ipcMain.handle('turnMonitor:save', async (_event, data: {
  campaignId: string
  content: string
}) => {
  return await db.turnMonitor.upsert({
    where: { campaignId: data.campaignId },
    create: { campaignId: data.campaignId, content: data.content },
    update: { content: data.content }
  })
})

ipcMain.handle('players:create', async (_event, data: {
  campaignId: string
  name: string
  playerName?: string
  className: string
  subclass?: string
  level: number
  ancestry: string
  background?: string
  alignment?: string
  experience?: number
  inspiration?: boolean
  proficiencyBonus?: number
  hitPoints: number
  currentHitPoints?: number
  tempHitPoints?: number
  hitDice?: string
  deathSaves?: string
  passivePerception?: number
  armorClass: number
  initiative?: number
  speed?: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  savingThrows?: string
  proficiencies?: string
  skills?: string
  attacks?: string
  spells?: string
  equipment?: string
  features?: string
  personalityTraits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  notes?: string
}) => {
  return await db.playerCharacter.create({ data })
})

ipcMain.handle('players:update', async (_event, id: string, data: {
  name: string
  playerName?: string
  className: string
  subclass?: string
  level: number
  ancestry: string
  background?: string
  alignment?: string
  experience?: number
  inspiration?: boolean
  proficiencyBonus?: number
  hitPoints: number
  currentHitPoints?: number
  tempHitPoints?: number
  hitDice?: string
  deathSaves?: string
  passivePerception?: number
  armorClass: number
  initiative?: number
  speed?: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  savingThrows?: string
  proficiencies?: string
  skills?: string
  attacks?: string
  spells?: string
  equipment?: string
  features?: string
  personalityTraits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  notes?: string
}) => {
  return await db.playerCharacter.update({
    where: { id },
    data
  })
})

ipcMain.handle('players:delete', async (_event, id: string) => {
  await db.playerCharacter.delete({ where: { id } })
  return true
})

// === Áudio ===
ipcMain.handle('audio:getDevices', async () => {
  // Dispositivos são listados no renderer via navigator.mediaDevices
  return []
})

ipcMain.handle('audio:startRecording', async (_event, deviceId: string, sessionId: string) => {
  return await startRecording(sessionId)
})

ipcMain.handle('audio:stopRecording', async () => {
  await stopRecording()
  return true
})

ipcMain.handle('audio:sendChunk', async (_event, audioData: Buffer) => {
  sendAudioChunk(audioData)
  return true
})

ipcMain.handle('audio:checkSTT', async () => {
  return await checkSTTHealth()
})

// === Transcrições ===
ipcMain.handle('transcripts:getBySession', async (_event, sessionId: string) => {
  return await db.transcriptChunk.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' }
  })
})

ipcMain.handle('transcripts:search', async (_event, query: string) => {
  return await db.transcriptChunk.findMany({
    where: {
      text: { contains: query }
    },
    take: 100,
    orderBy: { createdAt: 'desc' }
  })
})

// === Escudo do Mestre ===
ipcMain.handle('dmShield:open', async () => {
  if (!dmShieldWindow) {
    dmShieldWindow = createDmShieldWindow()
  } else {
    dmShieldWindow.focus()
  }
  return true
})

ipcMain.handle('dmShield:close', async () => {
  if (dmShieldWindow) {
    dmShieldWindow.close()
  }
  return true
})

ipcMain.handle('dmShield:getState', async () => {
  return {
    isOpen: Boolean(dmShieldWindow),
    alwaysOnTop: dmShieldWindow?.isAlwaysOnTop() ?? dmShieldAlwaysOnTop
  }
})

ipcMain.handle('dmShield:setAlwaysOnTop', async (_event, enabled: boolean) => {
  dmShieldAlwaysOnTop = enabled
  if (dmShieldWindow) {
    dmShieldWindow.setAlwaysOnTop(enabled)
  }
  return dmShieldAlwaysOnTop
})

ipcMain.handle('dmShield:getOptions', async () => {
  const options = [] as Array<{ id: string; title: string; content: string }>

  for (const fileName of dmShieldFiles) {
    const resolvedPath = await resolveDmShieldFile(fileName)
    if (!resolvedPath) {
      continue
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf-8')
      const fallbackTitle = fileName.replace(/_/g, ' ').replace(/\.md$/, '')
      const title = parseDmShieldTitle(content, fallbackTitle)
      options.push({
        id: fileName,
        title,
        content
      })
    } catch (error) {
      console.error(`Erro ao ler ${fileName}:`, error)
    }
  }

  return options
})

// === Shell ===
ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  await shell.openExternal(url)
  return true
})

// === Monsters (SRD 5e) ===
let monstersCache: unknown[] | null = null

ipcMain.handle('monsters:getAll', async () => {
  if (monstersCache) {
    return monstersCache
  }
  
  try {
    // Em desenvolvimento, o arquivo está em database/
    // Em produção, precisa estar incluído no build
    const isDev = !app.isPackaged
    const basePath = isDev 
      ? path.join(app.getAppPath(), 'database')
      : path.join(process.resourcesPath, 'database')
    
    const filePath = path.join(basePath, '5e-SRD-Monsters.json')
    const content = await fs.readFile(filePath, 'utf-8')
    monstersCache = JSON.parse(content)
    return monstersCache
  } catch (error) {
    console.error('Erro ao carregar monstros:', error)
    return []
  }
})

// Cache de imagens dos monstros
const imageCache = new Map<string, string>()

ipcMain.handle('monsters:getImage', async (_event, imagePath: string) => {
  if (!imagePath) return null
  
  // Verifica se já está em cache (memória)
  if (imageCache.has(imagePath)) {
    return imageCache.get(imagePath)
  }
  
  try {
    // Define pasta de cache
    const isDev = !app.isPackaged
    const basePath = isDev 
      ? path.join(app.getAppPath(), 'images')
      : path.join(app.getPath('userData'), 'images')
    
    // Cria pasta se não existir
    await fs.mkdir(basePath, { recursive: true })
    
    // Nome do arquivo baseado no path da API
    const fileName = imagePath.replace(/\//g, '_').replace(/^_/, '')
    const localPath = path.join(basePath, fileName)
    
    // Verifica se já existe no disco
    try {
      await fs.access(localPath)
      // Arquivo existe, lê e retorna como data URL
      const buffer = await fs.readFile(localPath)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:image/png;base64,${base64}`
      imageCache.set(imagePath, dataUrl)
      return dataUrl
    } catch {
      // Arquivo não existe, precisa baixar
    }
    
    // Baixa da API
    const url = `https://www.dnd5eapi.co${imagePath}`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`Erro ao baixar imagem: ${response.status}`)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Salva no disco
    await fs.writeFile(localPath, buffer)
    
    // Converte para data URL e cacheia
    const base64 = buffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`
    imageCache.set(imagePath, dataUrl)
    
    return dataUrl
  } catch (error) {
    console.error('Erro ao carregar imagem do monstro:', error)
    return null
  }
})

console.log('✓ IPC handlers registrados')
