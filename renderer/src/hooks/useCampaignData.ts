import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'

type TurnMonitorStatus = 'idle' | 'saving' | 'saved' | 'error'

type UseCampaignDataOptions<TCampaign, TSession, TPlayer, TNpc, TQuest, TLocation, TStoryEvent, TMasterNote, TTurnMonitor> = {
  campaignId: string
  createDefaultTurnMonitorData: () => TTurnMonitor
  normalizeTurnMonitorData: (value?: Partial<TTurnMonitor> | null) => TTurnMonitor
}

type UseCampaignDataResult<TCampaign, TSession, TPlayer, TNpc, TQuest, TLocation, TStoryEvent, TMasterNote, TTurnMonitor> = {
  campaign: TCampaign | null
  sessions: TSession[]
  players: TPlayer[]
  npcs: TNpc[]
  quests: TQuest[]
  locations: TLocation[]
  storyEvents: TStoryEvent[]
  masterNote: TMasterNote | null
  masterNoteContent: string
  setMasterNoteContent: Dispatch<SetStateAction<string>>
  setMasterNote: Dispatch<SetStateAction<TMasterNote | null>>
  turnMonitor: TTurnMonitor
  setTurnMonitor: Dispatch<SetStateAction<TTurnMonitor>>
  turnMonitorStatus: TurnMonitorStatus
  hasLoadedTurnMonitorRef: MutableRefObject<boolean>
  loadCampaign: () => Promise<void>
  loadSessions: () => Promise<void>
  loadPlayers: () => Promise<void>
  loadNpcs: () => Promise<void>
  loadQuests: () => Promise<void>
  loadLocations: () => Promise<void>
  loadStoryEvents: () => Promise<void>
  loadMasterNote: () => Promise<void>
  loadTurnMonitor: () => Promise<void>
  saveTurnMonitor: (data: TTurnMonitor, showStatus?: boolean) => Promise<void>
}

export const useCampaignData = <
  TCampaign,
  TSession,
  TPlayer,
  TNpc,
  TQuest,
  TLocation,
  TStoryEvent,
  TMasterNote,
  TTurnMonitor
>({
  campaignId,
  createDefaultTurnMonitorData,
  normalizeTurnMonitorData
}: UseCampaignDataOptions<TCampaign, TSession, TPlayer, TNpc, TQuest, TLocation, TStoryEvent, TMasterNote, TTurnMonitor>):
  UseCampaignDataResult<TCampaign, TSession, TPlayer, TNpc, TQuest, TLocation, TStoryEvent, TMasterNote, TTurnMonitor> => {
  const [campaign, setCampaign] = useState<TCampaign | null>(null)
  const [sessions, setSessions] = useState<TSession[]>([])
  const [players, setPlayers] = useState<TPlayer[]>([])
  const [npcs, setNpcs] = useState<TNpc[]>([])
  const [quests, setQuests] = useState<TQuest[]>([])
  const [locations, setLocations] = useState<TLocation[]>([])
  const [storyEvents, setStoryEvents] = useState<TStoryEvent[]>([])
  const [masterNote, setMasterNote] = useState<TMasterNote | null>(null)
  const [masterNoteContent, setMasterNoteContent] = useState('')
  const [turnMonitor, setTurnMonitor] = useState<TTurnMonitor>(() => createDefaultTurnMonitorData())
  const [turnMonitorStatus, setTurnMonitorStatus] = useState<TurnMonitorStatus>('idle')
  const hasLoadedTurnMonitorRef = useRef(false)

  const loadCampaign = useCallback(async () => {
    try {
      const data = await window.electron.campaigns.getAll()
      const typed = data as unknown as Array<TCampaign & { id: string }>
      const current = typed.find((item) => item.id === campaignId) || null
      setCampaign(current)
    } catch (error) {
      console.error('Erro ao carregar campanha:', error)
    }
  }, [campaignId])

  const loadSessions = useCallback(async () => {
    try {
      const data = await window.electron.sessions.getByCapaign(campaignId)
      setSessions(data as TSession[])
    } catch (error) {
      console.error('Erro ao carregar sessoes:', error)
    }
  }, [campaignId])

  const loadPlayers = useCallback(async () => {
    try {
      const data = await window.electron.players.getByCampaign(campaignId)
      setPlayers(data as TPlayer[])
    } catch (error) {
      console.error('Erro ao carregar personagens:', error)
    }
  }, [campaignId])

  const loadNpcs = useCallback(async () => {
    try {
      const data = await window.electron.npcs.getByCampaign(campaignId)
      setNpcs(data as TNpc[])
    } catch (error) {
      console.error('Erro ao carregar NPCs:', error)
    }
  }, [campaignId])

  const loadQuests = useCallback(async () => {
    try {
      const data = await window.electron.quests.getByCampaign(campaignId)
      setQuests(data as TQuest[])
    } catch (error) {
      console.error('Erro ao carregar quests:', error)
    }
  }, [campaignId])

  const loadLocations = useCallback(async () => {
    try {
      const data = await window.electron.locations.getByCampaign(campaignId)
      setLocations(data as TLocation[])
    } catch (error) {
      console.error('Erro ao carregar locais:', error)
    }
  }, [campaignId])

  const loadStoryEvents = useCallback(async () => {
    try {
      const data = await window.electron.storyEvents.getByCampaign(campaignId)
      setStoryEvents(data as TStoryEvent[])
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    }
  }, [campaignId])

  const loadMasterNote = useCallback(async () => {
    try {
      const data = await window.electron.masterNotes.getByCampaign(campaignId)
      setMasterNote(data as TMasterNote)
      const content = (data as { content?: string } | null)?.content || ''
      setMasterNoteContent(content)
    } catch (error) {
      console.error('Erro ao carregar anotacoes do mestre:', error)
    }
  }, [campaignId])

  const loadTurnMonitor = useCallback(async () => {
    try {
      const data = await window.electron.turnMonitor.getByCampaign(campaignId)
      const parsed = data?.content ? JSON.parse(data.content) : null
      setTurnMonitor(normalizeTurnMonitorData(parsed))
      setTurnMonitorStatus('idle')
    } catch (error) {
      console.error('Erro ao carregar monitoramento de turnos:', error)
      setTurnMonitor(createDefaultTurnMonitorData())
      setTurnMonitorStatus('error')
    } finally {
      hasLoadedTurnMonitorRef.current = true
    }
  }, [campaignId, createDefaultTurnMonitorData, normalizeTurnMonitorData])

  const saveTurnMonitor = useCallback(async (data: TTurnMonitor, showStatus = true) => {
    try {
      if (showStatus) {
        setTurnMonitorStatus('saving')
      }
      await window.electron.turnMonitor.save({
        campaignId,
        content: JSON.stringify(data)
      })
      if (showStatus) {
        setTurnMonitorStatus('saved')
        setTimeout(() => setTurnMonitorStatus('idle'), 1400)
      }
    } catch (error) {
      console.error('Erro ao salvar monitoramento de turnos:', error)
      setTurnMonitorStatus('error')
    }
  }, [campaignId])

  useEffect(() => {
    loadCampaign()
    loadSessions()
    loadPlayers()
    loadNpcs()
    loadQuests()
    loadLocations()
    loadStoryEvents()
    loadMasterNote()
    loadTurnMonitor()
  }, [
    loadCampaign,
    loadSessions,
    loadPlayers,
    loadNpcs,
    loadQuests,
    loadLocations,
    loadStoryEvents,
    loadMasterNote,
    loadTurnMonitor
  ])

  return {
    campaign,
    sessions,
    players,
    npcs,
    quests,
    locations,
    storyEvents,
    masterNote,
    masterNoteContent,
    setMasterNoteContent,
    setMasterNote,
    turnMonitor,
    setTurnMonitor,
    turnMonitorStatus,
    hasLoadedTurnMonitorRef,
    loadCampaign,
    loadSessions,
    loadPlayers,
    loadNpcs,
    loadQuests,
    loadLocations,
    loadStoryEvents,
    loadMasterNote,
    loadTurnMonitor,
    saveTurnMonitor
  }
}
