import { useEffect, useMemo, useState } from 'react'
import './RecordedSessions.css'

interface Campaign {
  id: string
  name: string
}

interface SessionWithCampaign {
  id: string
  campaignId: string
  startedAt: Date
  endedAt?: Date
  campaign?: Campaign
}

interface TranscriptChunk {
  id: string
  sessionId: string
  text: string
  timestamp: number
}

interface RecordedSessionsProps {
  initialSessionId?: string | null
}

function RecordedSessions({ initialSessionId = null }: RecordedSessionsProps) {
  const [sessions, setSessions] = useState<SessionWithCampaign[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSessionId)
  const [transcripts, setTranscripts] = useState<TranscriptChunk[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all')

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (initialSessionId) {
      setSelectedSessionId(initialSessionId)
    }
  }, [initialSessionId])

  useEffect(() => {
    if (!selectedSessionId) {
      setTranscripts([])
      return
    }
    loadTranscripts(selectedSessionId)
  }, [selectedSessionId])

  const selectedSession = useMemo(() => {
    return sessions.find((session) => session.id === selectedSessionId) || null
  }, [sessions, selectedSessionId])

  const campaigns = useMemo(() => {
    const map = new Map<string, Campaign>()
    sessions.forEach((session) => {
      if (session.campaign) {
        map.set(session.campaign.id, session.campaign)
      }
    })
    return Array.from(map.values())
  }, [sessions])

  const filteredSessions = useMemo(() => {
    if (selectedCampaignId === 'all') return sessions
    return sessions.filter((session) => session.campaign?.id === selectedCampaignId)
  }, [sessions, selectedCampaignId])

  const loadSessions = async () => {
    try {
      setLoadingSessions(true)
      const data = await window.electron.sessions.getAll()
      setSessions(data)
      if (!selectedSessionId && data.length > 0) {
        setSelectedSessionId(data[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar sessoes:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const loadTranscripts = async (sessionId: string) => {
    try {
      setLoadingTranscripts(true)
      const data = await window.electron.transcripts.getBySession(sessionId)
      setTranscripts(data)
    } catch (error) {
      console.error('Erro ao carregar transcricoes:', error)
    } finally {
      setLoadingTranscripts(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Deseja remover esta sessao gravada?')) return

    try {
      await window.electron.sessions.delete(sessionId)
      const updated = sessions.filter((session) => session.id !== sessionId)
      setSessions(updated)

      if (selectedSessionId === sessionId) {
        const nextSession = updated[0] || null
        setSelectedSessionId(nextSession ? nextSession.id : null)
      }
    } catch (error) {
      console.error('Erro ao remover sessao:', error)
    }
  }

  const formatDate = (value?: Date) => {
    if (!value) return 'Em andamento'
    return new Date(value).toLocaleString('pt-BR')
  }

  return (
    <div className="recorded-sessions">
      <header className="recorded-header">
        <div>
          <h2>Sessoes Gravadas</h2>
          <p className="text-muted">Selecione uma sessao para ver a transcricao</p>
        </div>
        <div className="recorded-actions">
          <label className="recorded-filter">
            <span>Campanha</span>
            <select
              value={selectedCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
            >
              <option value="all">Todas</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-secondary" onClick={loadSessions}>
            Atualizar
          </button>
        </div>
      </header>

      <div className="recorded-body">
        <aside className="recorded-list">
          {loadingSessions ? (
            <div className="recorded-empty">Carregando sessoes...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="recorded-empty">Nenhuma sessao gravada</div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`recorded-item ${session.id === selectedSessionId ? 'active' : ''}`}
              >
                <button
                  className="recorded-select"
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <div className="recorded-title">
                    {session.campaign?.name || 'Campanha desconhecida'}
                  </div>
                  <div className="recorded-meta">
                    <span>Inicio: {formatDate(session.startedAt)}</span>
                    <span>Fim: {formatDate(session.endedAt)}</span>
                  </div>
                </button>
                <button
                  className="recorded-delete"
                  onClick={() => handleDeleteSession(session.id)}
                  aria-label="Remover sessao"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </aside>

        <section className="recorded-details">
          {!selectedSession ? (
            <div className="recorded-empty">Selecione uma sessao</div>
          ) : loadingTranscripts ? (
            <div className="recorded-empty">Carregando transcricao...</div>
          ) : transcripts.length === 0 ? (
            <div className="recorded-empty">Nenhuma transcricao encontrada</div>
          ) : (
            <div className="recorded-transcript">
              <h3>{selectedSession.campaign?.name || 'Sessao'}</h3>
              <div className="recorded-meta">
                <span>Inicio: {formatDate(selectedSession.startedAt)}</span>
                <span>Fim: {formatDate(selectedSession.endedAt)}</span>
              </div>
              <div className="recorded-text">
                {transcripts.map((chunk) => (
                  <p key={chunk.id}>{chunk.text}</p>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default RecordedSessions
