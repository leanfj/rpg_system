import { contextBridge, ipcRenderer } from 'electron'

/**
 * API exposta para o renderer (React).
 * Cada método aqui é uma "porta" controlada para funcionalidades do sistema.
 * 
 * IMPORTANTE: Nunca exponha ipcRenderer diretamente.
 * Sempre crie métodos específicos com validação.
 */
const electronAPI = {
  // === Sistema ===
  platform: process.platform,
  
  // === Campanhas ===
  campaigns: {
    getAll: () => ipcRenderer.invoke('campaigns:getAll'),
    create: (name: string) => ipcRenderer.invoke('campaigns:create', name),
    delete: (id: string) => ipcRenderer.invoke('campaigns:delete', id)
  },
  
  // === Sessões ===
  sessions: {
    getAll: () => ipcRenderer.invoke('sessions:getAll'),
    start: (campaignId: string) => ipcRenderer.invoke('sessions:start', campaignId),
    stop: (sessionId: string) => ipcRenderer.invoke('sessions:stop', sessionId),
    delete: (sessionId: string) => ipcRenderer.invoke('sessions:delete', sessionId),
    getByCapaign: (campaignId: string) => ipcRenderer.invoke('sessions:getByCampaign', campaignId)
  },
  
  // === Áudio ===
  audio: {
    getDevices: () => ipcRenderer.invoke('audio:getDevices'),
    startRecording: (deviceId: string, sessionId: string) => 
      ipcRenderer.invoke('audio:startRecording', deviceId, sessionId),
    stopRecording: () => ipcRenderer.invoke('audio:stopRecording'),
    sendChunk: (audioData: ArrayBuffer) => 
      ipcRenderer.invoke('audio:sendChunk', Buffer.from(audioData)),
    checkSTT: () => ipcRenderer.invoke('audio:checkSTT'),
    
    // Listener para transcrições em tempo real
    onTranscript: (callback: (text: string, timestamp: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, text: string, timestamp: number) => {
        callback(text, timestamp)
      }
      ipcRenderer.on('audio:transcript', handler)
      
      // Retorna função para remover o listener
      return () => ipcRenderer.removeListener('audio:transcript', handler)
    }
  },
  
  // === Transcrições ===
  transcripts: {
    getBySession: (sessionId: string) => ipcRenderer.invoke('transcripts:getBySession', sessionId),
    search: (query: string) => ipcRenderer.invoke('transcripts:search', query)
  },

  // === Personagens jogadores ===
  players: {
    getByCampaign: (campaignId: string) => ipcRenderer.invoke('players:getByCampaign', campaignId),
    create: (data: {
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
    }) => ipcRenderer.invoke('players:create', data),
    update: (id: string, data: {
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
    }) => ipcRenderer.invoke('players:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('players:delete', id)
  },

  // === NPCs ===
  npcs: {
    getByCampaign: (campaignId: string) => ipcRenderer.invoke('npcs:getByCampaign', campaignId),
    create: (data: {
      campaignId: string
      name: string
      race?: string
      occupation?: string
      location?: string
      tags?: string
      notes?: string
    }) => ipcRenderer.invoke('npcs:create', data),
    update: (id: string, data: {
      name: string
      race?: string
      occupation?: string
      location?: string
      tags?: string
      notes?: string
    }) => ipcRenderer.invoke('npcs:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('npcs:delete', id)
  },

  // === Quests ===
  quests: {
    getByCampaign: (campaignId: string) => ipcRenderer.invoke('quests:getByCampaign', campaignId),
    create: (data: {
      campaignId: string
      title: string
      status: string
      objective?: string
      reward?: string
      notes?: string
    }) => ipcRenderer.invoke('quests:create', data),
    update: (id: string, data: {
      title: string
      status: string
      objective?: string
      reward?: string
      notes?: string
    }) => ipcRenderer.invoke('quests:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('quests:delete', id)
  },

  // === Anotacoes do mestre ===
  masterNotes: {
    getByCampaign: (campaignId: string) => ipcRenderer.invoke('masterNotes:getByCampaign', campaignId),
    save: (data: { campaignId: string; content: string }) => ipcRenderer.invoke('masterNotes:save', data)
  },

  // === Monitoramento de turnos ===
  turnMonitor: {
    getByCampaign: (campaignId: string) => ipcRenderer.invoke('turnMonitor:getByCampaign', campaignId),
    save: (data: { campaignId: string; content: string }) => ipcRenderer.invoke('turnMonitor:save', data)
  },

  // === Locais ===
  locations: {
    getByCampaign: (campaignId: string) => ipcRenderer.invoke('locations:getByCampaign', campaignId),
    create: (data: {
      campaignId: string
      name: string
      description?: string
      status?: string
      notes?: string
    }) => ipcRenderer.invoke('locations:create', data),
    update: (id: string, data: {
      name: string
      description?: string
      status?: string
      notes?: string
    }) => ipcRenderer.invoke('locations:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('locations:delete', id)
  },

  // === Eventos narrativos ===
  storyEvents: {
    getByCampaign: (campaignId: string) => ipcRenderer.invoke('storyEvents:getByCampaign', campaignId),
    create: (data: {
      campaignId: string
      title: string
      description?: string
      status?: string
      impact?: string
    }) => ipcRenderer.invoke('storyEvents:create', data),
    update: (id: string, data: {
      title: string
      description?: string
      status?: string
      impact?: string
    }) => ipcRenderer.invoke('storyEvents:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('storyEvents:delete', id)
  },

  // === Notas de sessao ===
  sessionNotes: {
    getBySession: (sessionId: string) => ipcRenderer.invoke('sessionNotes:getBySession', sessionId),
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
    }) => ipcRenderer.invoke('sessionNotes:create', data),
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
    }) => ipcRenderer.invoke('sessionNotes:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('sessionNotes:delete', id)
  },
  
    // === Escudo do Mestre ===
    dmShield: {
      open: () => ipcRenderer.invoke('dmShield:open'),
      close: () => ipcRenderer.invoke('dmShield:close'),
      getOptions: () => ipcRenderer.invoke('dmShield:getOptions'),
      getState: () => ipcRenderer.invoke('dmShield:getState'),
      setAlwaysOnTop: (enabled: boolean) => ipcRenderer.invoke('dmShield:setAlwaysOnTop', enabled)
    },

  // === Midia ===
  media: {
    pickAudioFiles: () => ipcRenderer.invoke('media:pickAudioFiles'),
    readAudioFile: (filePath: string) => ipcRenderer.invoke('media:readAudioFile', filePath),
    toFileUrl: (filePath: string) => {
      const normalized = filePath.replace(/\\/g, '/')
      const prefix = normalized.startsWith('/') ? '' : '/'
      return `file://${encodeURI(`${prefix}${normalized}`)}`
    }
  },

  // === Shell ===
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  },

  // === Monsters ===
  monsters: {
    getAll: () => ipcRenderer.invoke('monsters:getAll'),
    getImage: (imagePath: string) => ipcRenderer.invoke('monsters:getImage', imagePath)
  }
}

// Expõe a API para o renderer
contextBridge.exposeInMainWorld('electron', electronAPI)

// Tipos para TypeScript no renderer
export type ElectronAPI = typeof electronAPI
