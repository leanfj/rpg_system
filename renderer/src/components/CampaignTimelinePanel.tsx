import { useMemo } from 'react'

interface Session {
  id: string
  title?: string
  startedAt: Date
  endedAt?: Date
  status: string
}

interface Quest {
  id: string
  title: string
  status: string
}

interface StoryEvent {
  id: string
  title: string
}

interface SessionNote {
  id: string
  sessionId: string
  phase: string
  importance?: string
  content: string
  quests?: Array<{ quest: Quest }>
  events?: Array<{ event: StoryEvent }>
}

interface CampaignTimelinePanelProps {
  sessions: Session[]
  quests: Quest[]
  sessionNotes: SessionNote[]
}

function CampaignTimelinePanel({
  sessions,
  quests,
  sessionNotes
}: CampaignTimelinePanelProps) {
  // Montar timeline com eventos por sessão
  const timeline = useMemo(() => {
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    )

    return sortedSessions.map((session, index) => {
      const sessionNotesForSession = sessionNotes.filter((n) => n.sessionId === session.id)

      // Extrair eventos e quests mencionados
      const eventsInSession = new Set<string>()
      const questsInSession = new Map<string, { title: string; status: string }>()
      const importantNotes = sessionNotesForSession.filter((n) => n.importance === 'high')

      sessionNotesForSession.forEach((note) => {
        note.events?.forEach(({ event }) => {
          eventsInSession.add(event.title)
        })
        note.quests?.forEach(({ quest }) => {
          questsInSession.set(quest.id, { title: quest.title, status: quest.status })
        })
      })

      return {
        index,
        session,
        notesCount: sessionNotesForSession.length,
        importantNotes: importantNotes.length,
        events: Array.from(eventsInSession),
        quests: Array.from(questsInSession.values()),
        totalConnections: sessionNotesForSession.reduce(
          (sum, note) => sum + ((note.quests?.length || 0) + (note.events?.length || 0)),
          0
        )
      }
    })
  }, [sessions, sessionNotes])

  // Progressão de quests
  const questProgression = useMemo(() => {
    const progression = new Map<string, Array<{ sessionIndex: number; status: string }>>()

    quests.forEach((quest) => {
      const statusHistory: Array<{ sessionIndex: number; status: string }> = []

      timeline.forEach((item) => {
        const questInNotes = item.quests.find((q) => q.title === quest.title)
        if (questInNotes) {
          statusHistory.push({ sessionIndex: item.index, status: questInNotes.status })
        }
      })

      if (statusHistory.length > 0) {
        progression.set(quest.id, statusHistory)
      }
    })

    return progression
  }, [timeline, quests])

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: '#10b981',
      pending: '#f59e0b',
      completed: '#3b82f6',
      failed: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      active: 'Ativa',
      pending: 'Pendente',
      completed: 'Concluída',
      failed: 'Falhou'
    }
    return labels[status] || status
  }

  if (timeline.length === 0) {
    return (
      <article className="dashboard-card campaign-timeline">
        <header>
          <h3>Timeline da Campanha</h3>
        </header>
        <p className="text-muted">Nenhuma sessão ainda. Crie a primeira sessão para começar!</p>
      </article>
    )
  }

  return (
    <article className="dashboard-card campaign-timeline">
      <header>
        <h3>Timeline da Campanha</h3>
        <div className="timeline-header-info">{timeline.length} sessões mapeadas</div>
      </header>

      <div className="timeline-content">
        {/* Linhas de Quests */}
        {questProgression.size > 0 && (
          <div className="quest-progress-section">
            <h5>Progressão de Quests</h5>
            <div className="quest-progression-list">
              {Array.from(questProgression.entries()).map(([questId, history]) => {
                const questTitle = quests.find((q) => q.id === questId)?.title || questId
                return (
                  <div key={questId} className="quest-progression-item">
                    <span className="quest-name">{questTitle}</span>
                    <div className="quest-status-timeline">
                      {timeline.map((timelineItem) => {
                        const status = history.find((h) => h.sessionIndex === timelineItem.index)?.status
                        return (
                          <div
                            key={timelineItem.session.id}
                            className="quest-status-dot"
                            title={status ? `S${timelineItem.index + 1}: ${getStatusLabel(status)}` : 'Não mencionada'}
                            style={status ? { backgroundColor: getStatusColor(status) } : {}}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Timeline de Sessões */}
        <div className="sessions-timeline">
          <h5>Sessões</h5>
          <div className="timeline-line">
            {timeline.map((item, index) => (
              <div key={item.session.id} className="timeline-item">
                <div className="timeline-marker">
                  <div className="timeline-dot" />
                  <div className="timeline-pointer" />
                </div>

                <div className="timeline-card">
                  <div className="timeline-header">
                    <h6>
                      {item.session.title ||
                        new Date(item.session.startedAt).toLocaleDateString('pt-BR')}
                    </h6>
                    <span className="session-number">S{index + 1}</span>
                  </div>

                  <div className="timeline-stats">
                    <span className="stat">
                      <span className="stat-icon">📝</span>
                      {item.notesCount} notas
                    </span>
                    {item.importantNotes > 0 && (
                      <span className="stat important">
                        <span className="stat-icon">⭐</span>
                        {item.importantNotes} importante
                      </span>
                    )}
                    {item.totalConnections > 0 && (
                      <span className="stat">
                        <span className="stat-icon">🔗</span>
                        {item.totalConnections} conexões
                      </span>
                    )}
                  </div>

                  {item.events.length > 0 && (
                    <div className="timeline-events">
                      <span className="timeline-label">Eventos:</span>
                      <ul>
                        {item.events.slice(0, 3).map((event, i) => (
                          <li key={i}>{event}</li>
                        ))}
                        {item.events.length > 3 && <li className="more">+{item.events.length - 3} mais</li>}
                      </ul>
                    </div>
                  )}

                  {item.quests.length > 0 && (
                    <div className="timeline-quests">
                      <span className="timeline-label">Quests:</span>
                      <ul>
                        {item.quests.slice(0, 2).map((quest, i) => (
                          <li key={i} className={`quest-${quest.status}`}>
                            {quest.title}
                          </li>
                        ))}
                        {item.quests.length > 2 && <li className="more">+{item.quests.length - 2} mais</li>}
                      </ul>
                    </div>
                  )}

                  <div className="timeline-date">
                    {new Date(item.session.startedAt).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="timeline-summary">
          <h5>Resumo da Campanha</h5>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-main">{timeline.length}</div>
              <div className="summary-label">Sessões</div>
            </div>
            <div className="summary-item">
              <div className="summary-main">{sessionNotes.length}</div>
              <div className="summary-label">Notas Totais</div>
            </div>
            <div className="summary-item">
              <div className="summary-main">
                {sessionNotes.filter((n) => n.importance === 'high').length}
              </div>
              <div className="summary-label">Momentos Importantes</div>
            </div>
            <div className="summary-item">
              <div className="summary-main">{quests.length}</div>
              <div className="summary-label">Quests</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default CampaignTimelinePanel
