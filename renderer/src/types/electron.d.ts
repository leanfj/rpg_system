/// <reference types="vite/client" />

interface Campaign {
  id: string
  name: string
  createdAt: Date
}

interface Session {
  id: string
  campaignId: string
  startedAt: Date
  endedAt?: Date
}

interface SessionWithCampaign extends Session {
  campaign?: Campaign
}

interface TranscriptChunk {
  id: string
  sessionId: string
  text: string
  timestamp: number
  confidence?: number
}

interface PlayerCharacter {
  id: string
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
  sheetUrl?: string
  createdAt: Date
  updatedAt: Date
}

interface NPC {
  id: string
  campaignId: string
  name: string
  race?: string
  occupation?: string
  location?: string
  tags?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface Quest {
  id: string
  campaignId: string
  title: string
  status: string
  objective?: string
  reward?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface MasterNote {
  id: string
  campaignId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

interface TurnMonitor {
  id: string
  campaignId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

interface ElectronAPI {
  platform: NodeJS.Platform
  
  campaigns: {
    getAll: () => Promise<Campaign[]>
    create: (name: string) => Promise<Campaign>
    delete: (id: string) => Promise<boolean>
  }
  
  sessions: {
    getAll: () => Promise<SessionWithCampaign[]>
    start: (campaignId: string) => Promise<Session>
    stop: (sessionId: string) => Promise<boolean>
    delete: (sessionId: string) => Promise<boolean>
    getByCapaign: (campaignId: string) => Promise<Session[]>
  }
  
  audio: {
    getDevices: () => Promise<MediaDeviceInfo[]>
    startRecording: (deviceId: string, sessionId: string) => Promise<boolean>
    stopRecording: () => Promise<boolean>
    sendChunk: (audioData: ArrayBuffer) => Promise<boolean>
    checkSTT: () => Promise<boolean>
    onTranscript: (callback: (text: string, timestamp: number) => void) => () => void
  }
  
  transcripts: {
    getBySession: (sessionId: string) => Promise<TranscriptChunk[]>
    search: (query: string) => Promise<TranscriptChunk[]>
  }

  players: {
    getByCampaign: (campaignId: string) => Promise<PlayerCharacter[]>
    create: (data: Omit<PlayerCharacter, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PlayerCharacter>
    update: (id: string, data: Omit<PlayerCharacter, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>) => Promise<PlayerCharacter>
    delete: (id: string) => Promise<boolean>
  }

  npcs: {
    getByCampaign: (campaignId: string) => Promise<NPC[]>
    create: (data: Omit<NPC, 'id' | 'createdAt' | 'updatedAt'>) => Promise<NPC>
    update: (id: string, data: Omit<NPC, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>) => Promise<NPC>
    delete: (id: string) => Promise<boolean>
  }

  quests: {
    getByCampaign: (campaignId: string) => Promise<Quest[]>
    create: (data: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Quest>
    update: (id: string, data: Omit<Quest, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>) => Promise<Quest>
    delete: (id: string) => Promise<boolean>
  }

  masterNotes: {
    getByCampaign: (campaignId: string) => Promise<MasterNote | null>
    save: (data: { campaignId: string; content: string }) => Promise<MasterNote>
  }

  turnMonitor: {
    getByCampaign: (campaignId: string) => Promise<TurnMonitor | null>
    save: (data: { campaignId: string; content: string }) => Promise<TurnMonitor>
  }

  media: {
    pickAudioFiles: () => Promise<string[]>
    readAudioFile: (filePath: string) => Promise<{ data: ArrayBuffer | Uint8Array; mimeType: string }>
    toFileUrl: (filePath: string) => string
  }

  shell: {
    openExternal: (url: string) => Promise<boolean>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
