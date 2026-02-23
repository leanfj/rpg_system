import { useState } from 'react'
import { useToast } from '../hooks/useToast'
import './SessionManagementPanel.css'

interface Session {
  id: string
  campaignId: string
  startedAt: Date
  endedAt?: Date
  title?: string
  notes?: string
  status: string
}

interface SessionManagementPanelProps {
  sessions: Session[]
  onSessionsChange: () => void
}

function SessionManagementPanel({ sessions, onSessionsChange }: SessionManagementPanelProps) {
  const { success, error } = useToast()
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    try {
      setIsUpdating(sessionId)
      await window.electron.sessions.updateStatus(sessionId, newStatus)
      success(`Status atualizado para: ${getStatusLabel(newStatus)}`)
      onSessionsChange()
    } catch (err) {
      error('Erro ao atualizar status da sessão')
      console.error(err)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta sessão?')) return

    try {
      setIsUpdating(sessionId)
      await window.electron.sessions.delete(sessionId)
      success('Sessão deletada com sucesso')
      onSessionsChange()
    } catch (err) {
      error('Erro ao deletar sessão')
      console.error(err)
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      planned: 'Planejada',
      in_progress: 'Em Progresso',
      finished: 'Finalizada'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      planned: '#f59e0b',
      in_progress: '#3b82f6',
      finished: '#10b981'
    }
    return colors[status] || '#6b7280'
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )

  return (
    <article className="dashboard-card session-management">
      <header>
        <h3>Gerenciamento de Sessões</h3>
        <span className="session-count">{sessions.length} sessões</span>
      </header>

      <div className="session-management-content">
        {sessions.length === 0 ? (
          <p className="text-muted">Nenhuma sessão registrada ainda.</p>
        ) : (
          <div className="sessions-list">
            {sortedSessions.map((session) => (
              <div key={session.id} className="session-item">
                <div
                  className="session-row"
                  onClick={() =>
                    setExpandedSessionId(
                      expandedSessionId === session.id ? null : session.id
                    )
                  }
                >
                  <div className="session-main-info">
                    <div className="session-header-row">
                      <h5>{session.title || `Sessão de ${formatDate(new Date(session.startedAt))}`}</h5>
                      <span
                        className="session-status-badge"
                        style={{ backgroundColor: getStatusColor(session.status) }}
                      >
                        {getStatusLabel(session.status)}
                      </span>
                    </div>
                    <p className="session-date">
                      Iniciada: {formatDate(new Date(session.startedAt))}
                    </p>
                    {session.endedAt && (
                      <p className="session-date">
                        Encerrada: {formatDate(new Date(session.endedAt))}
                      </p>
                    )}
                  </div>
                  <div className="session-arrow">
                    <span>{expandedSessionId === session.id ? '▼' : '▶'}</span>
                  </div>
                </div>

                {expandedSessionId === session.id && (
                  <div className="session-details">
                    {session.notes && (
                      <div className="session-notes">
                        <h6>Anotações:</h6>
                        <p>{session.notes}</p>
                      </div>
                    )}

                    <div className="session-status-controls">
                      <h6>Alterar Status:</h6>
                      <div className="status-buttons">
                        {(['planned', 'in_progress', 'finished'] as const).map((status) => (
                          <button
                            key={status}
                            className={`status-btn ${session.status === status ? 'active' : ''}`}
                            onClick={() => handleStatusChange(session.id, status)}
                            disabled={isUpdating === session.id || session.status === status}
                            style={{
                              borderColor: getStatusColor(status),
                              backgroundColor:
                                session.status === status ? getStatusColor(status) : 'transparent'
                            }}
                          >
                            {isUpdating === session.id ? '...' : getStatusLabel(status)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="session-actions">
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={isUpdating === session.id}
                      >
                        🗑️ Deletar Sessão
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default SessionManagementPanel
