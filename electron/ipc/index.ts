import { ipcMain, IpcMainInvokeEvent } from 'electron'
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

console.log('✓ IPC handlers registrados')
