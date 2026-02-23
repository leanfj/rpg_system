import { useMemo } from 'react'

interface Entity {
  id: string
  name?: string
  title?: string
  type: 'npc' | 'quest' | 'location' | 'event' | 'player'
}

interface Connection {
  entity: Entity
  mentions: number
}

interface ConnectionDashboardPanelProps {
  npcs: Array<{ id: string; name: string }>
  quests: Array<{ id: string; title: string; status: string }>
  locations: Array<{ id: string; name: string }>
  events: Array<{ id: string; title: string }>
  players: Array<{ id: string; name: string }>
  sessionNotes: Array<{
    id: string
    content: string
    npcs?: Array<{ npc: { id: string; name: string } }>
    quests?: Array<{ quest: { id: string; title: string } }>
    locations?: Array<{ location: { id: string; name: string } }>
    events?: Array<{ event: { id: string; title: string } }>
    players?: Array<{ player: { id: string; name: string } }>
  }>
}

function ConnectionDashboardPanel({
  npcs,
  quests,
  locations,
  events,
  players,
  sessionNotes
}: ConnectionDashboardPanelProps) {
  // Calcular força de conexão de cada entidade
  const connectionMetrics = useMemo(() => {
    const metrics = {
      npcs: new Map<string, number>(),
      quests: new Map<string, number>(),
      locations: new Map<string, number>(),
      events: new Map<string, number>(),
      players: new Map<string, number>()
    }

    // Contar menções em notas
    sessionNotes.forEach((note) => {
      note.npcs?.forEach(({ npc }) => {
        metrics.npcs.set(npc.id, (metrics.npcs.get(npc.id) || 0) + 1)
      })
      note.quests?.forEach(({ quest }) => {
        metrics.quests.set(quest.id, (metrics.quests.get(quest.id) || 0) + 1)
      })
      note.locations?.forEach(({ location }) => {
        metrics.locations.set(location.id, (metrics.locations.get(location.id) || 0) + 1)
      })
      note.events?.forEach(({ event }) => {
        metrics.events.set(event.id, (metrics.events.get(event.id) || 0) + 1)
      })
      note.players?.forEach(({ player }) => {
        metrics.players.set(player.id, (metrics.players.get(player.id) || 0) + 1)
      })
    })

    return metrics
  }, [sessionNotes])

  // Calcular entidades mais conectadas
  const topConnections = useMemo(() => {
    const allConnections: Array<{
      entity: Entity
      mentions: number
      strength: number // Percentual da força total
    }> = []

    // NPCs
    npcs.forEach((npc) => {
      const mentions = connectionMetrics.npcs.get(npc.id) || 0
      if (mentions > 0) {
        allConnections.push({
          entity: { id: npc.id, name: npc.name, type: 'npc' },
          mentions,
          strength: 0
        })
      }
    })

    // Quests
    quests.forEach((quest) => {
      const mentions = connectionMetrics.quests.get(quest.id) || 0
      if (mentions > 0) {
        allConnections.push({
          entity: { id: quest.id, name: quest.title, type: 'quest' },
          mentions,
          strength: 0
        })
      }
    })

    // Locations
    locations.forEach((location) => {
      const mentions = connectionMetrics.locations.get(location.id) || 0
      if (mentions > 0) {
        allConnections.push({
          entity: { id: location.id, name: location.name, type: 'location' },
          mentions,
          strength: 0
        })
      }
    })

    // Events
    events.forEach((event) => {
      const mentions = connectionMetrics.events.get(event.id) || 0
      if (mentions > 0) {
        allConnections.push({
          entity: { id: event.id, name: event.title, type: 'event' },
          mentions,
          strength: 0
        })
      }
    })

    // Players
    players.forEach((player) => {
      const mentions = connectionMetrics.players.get(player.id) || 0
      if (mentions > 0) {
        allConnections.push({
          entity: { id: player.id, name: player.name, type: 'player' },
          mentions,
          strength: 0
        })
      }
    })

    // Calcular força (percentual do máximo)
    const maxMentions = Math.max(...allConnections.map((c) => c.mentions), 1)
    allConnections.forEach((connection) => {
      connection.strength = (connection.mentions / maxMentions) * 100
    })

    // Retornar top 15 mais conectadas
    return allConnections.sort((a, b) => b.mentions - a.mentions).slice(0, 15)
  }, [npcs, quests, locations, events, players, connectionMetrics])

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalMentions = Array.from(connectionMetrics.npcs.values()).reduce((a, b) => a + b, 0) +
      Array.from(connectionMetrics.quests.values()).reduce((a, b) => a + b, 0) +
      Array.from(connectionMetrics.locations.values()).reduce((a, b) => a + b, 0) +
      Array.from(connectionMetrics.events.values()).reduce((a, b) => a + b, 0) +
      Array.from(connectionMetrics.players.values()).reduce((a, b) => a + b, 0)

    const entitiesWithConnections =
      Array.from(connectionMetrics.npcs.values()).filter((m) => m > 0).length +
      Array.from(connectionMetrics.quests.values()).filter((m) => m > 0).length +
      Array.from(connectionMetrics.locations.values()).filter((m) => m > 0).length +
      Array.from(connectionMetrics.events.values()).filter((m) => m > 0).length +
      Array.from(connectionMetrics.players.values()).filter((m) => m > 0).length

    const avgMentions = entitiesWithConnections > 0 ? Math.round(totalMentions / entitiesWithConnections) : 0

    return { totalMentions, entitiesWithConnections, avgMentions }
  }, [connectionMetrics])

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'npc':
        return '🟢'
      case 'quest':
        return '📜'
      case 'location':
        return '📍'
      case 'event':
        return '⚡'
      case 'player':
        return '⚔️'
      default:
        return '•'
    }
  }

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      npc: 'NPC',
      quest: 'Quest',
      location: 'Location',
      event: 'Event',
      player: 'Player Character'
    }
    return labels[type] || type
  }

  return (
    <article className="dashboard-card connection-dashboard">
      <header>
        <h3>Dashboard de Conexões</h3>
        <div className="connection-header-info">Força de relacionamento entre entidades</div>
      </header>

      <div className="connection-content">
        {/* Estatísticas Rápidas */}
        <div className="connection-stats">
          <div className="connection-stat">
            <div className="stat-number">{stats.totalMentions}</div>
            <div className="stat-text">Menções Totais</div>
          </div>
          <div className="connection-stat">
            <div className="stat-number">{stats.entitiesWithConnections}</div>
            <div className="stat-text">Entidades Conectadas</div>
          </div>
          <div className="connection-stat">
            <div className="stat-number">{stats.avgMentions}</div>
            <div className="stat-text">Menções / Entidade</div>
          </div>
        </div>

        {/* Entidades mais conectadas */}
        {topConnections.length > 0 ? (
          <div className="connection-list">
            <h5>Entidades Mais Mencionadas</h5>
            {topConnections.map((connection) => (
              <div key={`${connection.entity.type}-${connection.entity.id}`} className="connection-item">
                <div className="connection-label">
                  <span className="entity-icon">{getEntityIcon(connection.entity.type)}</span>
                  <span className="entity-name">{connection.entity.name}</span>
                  <span className="entity-type">{getEntityTypeLabel(connection.entity.type)}</span>
                </div>

                <div className="connection-bar-wrapper">
                  <div
                    className="connection-bar"
                    style={{ width: `${connection.strength}%` }}
                    data-mentions={connection.mentions}
                  />
                  <span className="connection-count">{connection.mentions}x</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">Nenhuma conexão ainda. Comece a criar notas de sessão!</p>
        )}

        {/* Breakdown por tipo */}
        {stats.totalMentions > 0 && (
          <div className="connection-breakdown">
            <h5>Distribuição por Tipo</h5>
            <div className="breakdown-grid">
              {connectionMetrics.npcs.size > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-icon">🟢</span>
                  <span className="breakdown-label">NPCs</span>
                  <span className="breakdown-count">
                    {Array.from(connectionMetrics.npcs.values()).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              )}
              {connectionMetrics.quests.size > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-icon">📜</span>
                  <span className="breakdown-label">Quests</span>
                  <span className="breakdown-count">
                    {Array.from(connectionMetrics.quests.values()).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              )}
              {connectionMetrics.locations.size > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-icon">📍</span>
                  <span className="breakdown-label">Locations</span>
                  <span className="breakdown-count">
                    {Array.from(connectionMetrics.locations.values()).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              )}
              {connectionMetrics.events.size > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-icon">⚡</span>
                  <span className="breakdown-label">Events</span>
                  <span className="breakdown-count">
                    {Array.from(connectionMetrics.events.values()).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              )}
              {connectionMetrics.players.size > 0 && (
                <div className="breakdown-item">
                  <span className="breakdown-icon">⚔️</span>
                  <span className="breakdown-label">Players</span>
                  <span className="breakdown-count">
                    {Array.from(connectionMetrics.players.values()).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export default ConnectionDashboardPanel
