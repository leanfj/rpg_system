import { useMemo } from 'react'

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

interface SessionNote {
  id: string
  sessionId: string
  phase: string
  content: string
  importance: string
  npcs?: Array<{ id: string; npc: NPC }>
  players?: Array<{ id: string; player: { id: string; name: string } }>
  quests?: Array<{ id: string; quest: Quest }>
  locations?: Array<{ id: string; location: { id: string; name: string } }>
  events?: Array<{ id: string; event: { id: string; title: string } }>
}

interface SessionSummaryPanelProps {
  sessions: Session[]
  allNotes: SessionNote[]
}

function SessionSummaryPanel({ sessions, allNotes }: SessionSummaryPanelProps) {
  // Última sessão concluída
  const lastSession = useMemo(() => {
    return sessions
      .filter((s) => s.endedAt)
      .sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime())[0]
  }, [sessions])

  // Resumo da última sessão
  const sessionSummary = useMemo(() => {
    if (!lastSession) return null

    const sessionNotes = allNotes.filter((n) => n.sessionId === lastSession.id)

    const npcsMentions = new Map<string, { name: string; count: number }>()
    const playersMentions = new Map<string, { name: string; count: number }>()
    const questsUpdated = new Map<string, { title: string; status: string }>()
    const locationsMentions = new Map<string, { name: string; count: number }>()
    const eventsMentions = new Map<string, { title: string; count: number }>()

    sessionNotes.forEach((note) => {
      // NPCs mencionados
      note.npcs?.forEach(({ npc }) => {
        const current = npcsMentions.get(npc.id) || { name: npc.name, count: 0 }
        npcsMentions.set(npc.id, { ...current, count: current.count + 1 })
      })

      // Jogadores mencionados
      note.players?.forEach(({ player }) => {
        const current = playersMentions.get(player.id) || { name: player.name, count: 0 }
        playersMentions.set(player.id, { ...current, count: current.count + 1 })
      })

      // Quests mencionadas
      note.quests?.forEach(({ quest }) => {
        questsUpdated.set(quest.id, { title: quest.title, status: quest.status })
      })

      // Localizações mencionadas
      note.locations?.forEach(({ location }) => {
        const current = locationsMentions.get(location.id) || { name: location.name, count: 0 }
        locationsMentions.set(location.id, { ...current, count: current.count + 1 })
      })

      // Eventos mencionados
      note.events?.forEach(({ event }) => {
        const current = eventsMentions.get(event.id) || { title: event.title, count: 0 }
        eventsMentions.set(event.id, { ...current, count: current.count + 1 })
      })
    })

    // Notas por importância
    const highImportanceNotes = sessionNotes.filter((n) => n.importance === 'high')

    // Duração da sessão
    const duration = lastSession.endedAt
      ? Math.round(
          (new Date(lastSession.endedAt).getTime() - new Date(lastSession.startedAt).getTime()) /
            (1000 * 60)
        )
      : 0

    return {
      totalNotes: sessionNotes.length,
      highImportanceNotes: highImportanceNotes.length,
      npcsMentioned: Array.from(npcsMentions.values()).sort((a, b) => b.count - a.count),
      playersMentioned: Array.from(playersMentions.values()).sort((a, b) => b.count - a.count),
      questsUpdated: Array.from(questsUpdated.values()),
      locationsMentioned: Array.from(locationsMentions.values()).sort((a, b) => b.count - a.count),
      eventsMentioned: Array.from(eventsMentions.values()).sort((a, b) => b.count - a.count),
      duration
    }
  }, [lastSession, allNotes])

  if (!lastSession || !sessionSummary) {
    return (
      <article className="dashboard-card session-summary">
        <header>
          <h3>Resumo da Sessão</h3>
        </header>
        <p className="text-muted">Nenhuma sessão concluída. Finalize uma sessão para ver o resumo.</p>
      </article>
    )
  }

  return (
    <article className="dashboard-card session-summary">
      <header>
        <h3>Resumo da Sessão</h3>
        <div className="summary-date">
          {lastSession.title || new Date(lastSession.startedAt).toLocaleDateString('pt-BR')}
        </div>
      </header>

      <div className="summary-content">
        {/* Estatísticas Rápidas */}
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-value">{sessionSummary.totalNotes}</div>
            <div className="stat-label">Notas Criadas</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value">{sessionSummary.highImportanceNotes}</div>
            <div className="stat-label">Notas Importantes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{sessionSummary.duration}m</div>
            <div className="stat-label">Duração</div>
          </div>
        </div>

        {/* Seções do Resumo */}
        {sessionSummary.npcsMentioned.length > 0 && (
          <div className="summary-section">
            <h5>🟢 NPCs Envolvidos ({sessionSummary.npcsMentioned.length})</h5>
            <ul className="summary-list">
              {sessionSummary.npcsMentioned.map((npc) => (
                <li key={npc.name}>
                  <span className="summary-name">{npc.name}</span>
                  <span className="summary-badge">{npc.count}x</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sessionSummary.playersMentioned.length > 0 && (
          <div className="summary-section">
            <h5>⚔️ Personagens Participantes ({sessionSummary.playersMentioned.length})</h5>
            <ul className="summary-list">
              {sessionSummary.playersMentioned.map((player) => (
                <li key={player.name}>
                  <span className="summary-name">{player.name}</span>
                  <span className="summary-badge">{player.count}x</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sessionSummary.questsUpdated.length > 0 && (
          <div className="summary-section">
            <h5>📜 Quests Mencionadas ({sessionSummary.questsUpdated.length})</h5>
            <ul className="summary-list">
              {sessionSummary.questsUpdated.map((quest) => (
                <li key={quest.title}>
                  <span className="summary-name">{quest.title}</span>
                  <span className={`summary-status status-${quest.status}`}>{quest.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sessionSummary.locationsMentioned.length > 0 && (
          <div className="summary-section">
            <h5>📍 Localizações Visitadas ({sessionSummary.locationsMentioned.length})</h5>
            <ul className="summary-list">
              {sessionSummary.locationsMentioned.map((location) => (
                <li key={location.name}>
                  <span className="summary-name">{location.name}</span>
                  <span className="summary-badge">{location.count}x</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sessionSummary.eventsMentioned.length > 0 && (
          <div className="summary-section">
            <h5>⚡ Eventos Narrativos ({sessionSummary.eventsMentioned.length})</h5>
            <ul className="summary-list">
              {sessionSummary.eventsMentioned.map((event) => (
                <li key={event.title}>
                  <span className="summary-name">{event.title}</span>
                  <span className="summary-badge">{event.count}x</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}

export default SessionSummaryPanel
