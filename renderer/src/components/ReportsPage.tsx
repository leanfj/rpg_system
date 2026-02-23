import { useState, useEffect } from 'react'
import SessionSummaryPanel from './SessionSummaryPanel'
import ConnectionDashboardPanel from './ConnectionDashboardPanel'
import CampaignTimelinePanel from './CampaignTimelinePanel'
import './SessionSummaryPanel.css'
import './ConnectionDashboardPanel.css'
import './CampaignTimelinePanel.css'
import './ReportsPage.css'

interface Session {
  id: string
  title?: string
  startedAt: Date
  endedAt?: Date
  status: string
}

interface NPC {
  id: string
  name: string
}

interface Quest {
  id: string
  title: string
  status: string
}

interface Location {
  id: string
  name: string
}

interface StoryEvent {
  id: string
  title: string
}

interface PlayerCharacter {
  id: string
  name: string
}

interface SessionNote {
  id: string
  sessionId: string
  phase: string
  content: string
  importance?: string
  npcs?: Array<{ npc: NPC }>
  quests?: Array<{ quest: Quest }>
  locations?: Array<{ location: Location }>
  events?: Array<{ event: StoryEvent }>
  players?: Array<{ player: { id: string; name: string } }>
}

interface ReportsPageProps {
  campaignId: string
}

function ReportsPage({ campaignId }: ReportsPageProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [storyEvents, setStoryEvents] = useState<StoryEvent[]>([])
  const [players, setPlayers] = useState<PlayerCharacter[]>([])
  const [sessionNotes, setSessionNotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        setIsLoading(true)
        const [sessionData, npcData, questData, locationData, eventData, playerData, notesData] =
          await Promise.all([
            window.electron.sessions.getByCapaign(campaignId),
            window.electron.npcs.getByCampaign(campaignId),
            window.electron.quests.getByCampaign(campaignId),
            window.electron.locations.getByCampaign(campaignId),
            window.electron.storyEvents.getByCampaign(campaignId),
            window.electron.players.getByCampaign(campaignId),
            window.electron.sessionNotes.getByCampaign(campaignId)
          ])

        setSessions(sessionData)
        setNpcs(npcData)
        setQuests(questData)
        setLocations(locationData)
        setStoryEvents(eventData)
        setPlayers(playerData)
        setSessionNotes(notesData)
      } catch (error) {
        console.error('Failed to load campaign data for reports:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaignData()
  }, [campaignId])

  if (isLoading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <div className="loading-spinner" />
          <p>Carregando dados da campanha...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1>📊 Relatórios e Análises da Campanha</h1>
        <p className="reports-subtitle">
          Visualizações detalhadas, cronologia e conexões entre entidades
        </p>
      </header>

      <div className="reports-container">
        <SessionSummaryPanel sessions={sessions} allNotes={sessionNotes} />

        <ConnectionDashboardPanel
          npcs={npcs}
          quests={quests}
          locations={locations}
          events={storyEvents}
          players={players}
          sessionNotes={sessionNotes}
        />

        <CampaignTimelinePanel sessions={sessions} quests={quests} sessionNotes={sessionNotes} />
      </div>
    </div>
  )
}

export default ReportsPage
