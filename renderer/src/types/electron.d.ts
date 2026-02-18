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
  title?: string
  notes?: string
  status: string // planned, in_progress, finished
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

interface Location {
  id: string
  campaignId: string
  name: string
  description?: string
  status: string // unknown, safe, dangerous
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface StoryEvent {
  id: string
  campaignId: string
  title: string
  description?: string
  status: string // active, resolved, ignored
  impact?: string // short, medium, long
  createdAt: Date
  updatedAt: Date
}

interface SessionNote {
  id: string
  sessionId: string
  phase: string // before, during, after
  content: string
  importance: string // normal, high
  order: number
  createdAt: Date
  updatedAt: Date
  npcs?: Array<{ id: string; sessionNoteId: string; npcId: string; npc: NPC }>
  players?: Array<{ id: string; sessionNoteId: string; playerId: string; player: PlayerCharacter }>
  quests?: Array<{ id: string; sessionNoteId: string; questId: string; quest: Quest }>
  locations?: Array<{ id: string; sessionNoteId: string; locationId: string; location: Location }>
  events?: Array<{ id: string; sessionNoteId: string; eventId: string; event: StoryEvent }>
}

interface DmShieldOption {
  id: string
  title: string
  content: string
}

interface DmShieldState {
  isOpen: boolean
  alwaysOnTop: boolean
}

interface SRDMonsterAction {
  name: string
  desc: string
  attack_bonus?: number
  damage?: Array<{
    damage_type: { name: string }
    damage_dice: string
  }>
}

interface SRDMonster {
  index: string
  name: string
  size: string
  type: string
  alignment: string
  armor_class: Array<{ type: string; value: number }>
  hit_points: number
  hit_dice: string
  hit_points_roll: string
  speed: Record<string, string>
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  proficiencies: Array<{
    value: number
    proficiency: { name: string }
  }>
  damage_vulnerabilities: string[]
  damage_resistances: string[]
  damage_immunities: string[]
  condition_immunities: Array<{ name: string }>
  senses: Record<string, string | number>
  languages: string
  challenge_rating: number
  proficiency_bonus: number
  xp: number
  special_abilities?: Array<{ name: string; desc: string }>
  actions?: SRDMonsterAction[]
  legendary_actions?: Array<{ name: string; desc: string }>
  image?: string
  url?: string
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

  locations: {
    getByCampaign: (campaignId: string) => Promise<Location[]>
    create: (data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Location>
    update: (id: string, data: Omit<Location, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>) => Promise<Location>
    delete: (id: string) => Promise<boolean>
  }

  storyEvents: {
    getByCampaign: (campaignId: string) => Promise<StoryEvent[]>
    create: (data: Omit<StoryEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StoryEvent>
    update: (id: string, data: Omit<StoryEvent, 'id' | 'campaignId' | 'createdAt' | 'updatedAt'>) => Promise<StoryEvent>
    delete: (id: string) => Promise<boolean>
  }

  sessionNotes: {
    getBySession: (sessionId: string) => Promise<SessionNote[]>
    create: (data: {
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
    }) => Promise<SessionNote>
    update: (id: string, data: {
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
    }) => Promise<SessionNote>
    delete: (id: string) => Promise<boolean>
  }

  dmShield: {
    open: () => Promise<boolean>
    close: () => Promise<boolean>
    getOptions: () => Promise<DmShieldOption[]>
    getState: () => Promise<DmShieldState>
    setAlwaysOnTop: (enabled: boolean) => Promise<boolean>
  }

  media: {
    pickAudioFiles: () => Promise<string[]>
    readAudioFile: (filePath: string) => Promise<{ data: ArrayBuffer | Uint8Array; mimeType: string }>
    toFileUrl: (filePath: string) => string
  }

  shell: {
    openExternal: (url: string) => Promise<boolean>
  }

  monsters: {
    getAll: () => Promise<SRDMonster[]>
    getImage: (imagePath: string) => Promise<string | null>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
