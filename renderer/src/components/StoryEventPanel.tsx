import type { Dispatch, SetStateAction } from 'react'

type StoryEventBase = {
  id: string
  title: string
  description?: string
  status: string
  impact?: string
}

type StoryEventForm = {
  title: string
  description: string
  status: string
  impact: string
}

type SessionNote = {
  id: string
  sessionId: string
  phase: string
  content: string
  session?: { id: string; title?: string; startedAt: Date }
}

type StoryEventPanelProps<TStoryEvent extends StoryEventBase> = {
  storyEvents: TStoryEvent[]
  storyEventForm: StoryEventForm
  isStoryEventModalOpen: boolean
  isStoryEventReadOnly: boolean
  editingStoryEventId: string | null
  relatedNotes?: SessionNote[]
  onCreate: () => void
  onView: (event: TStoryEvent) => void
  onEdit: (event: TStoryEvent) => void
  onDelete: (eventId: string) => void
  onCloseModal: () => void
  onSave: () => void
  setStoryEventForm: Dispatch<SetStateAction<StoryEventForm>>
}

const getStatusLabel = (status: string) => {
  if (status === 'active') return 'Ativo'
  if (status === 'resolved') return 'Resolvido'
  if (status === 'ignored') return 'Ignorado'
  return status
}

const getStatusClass = (status: string) => {
  if (status === 'active') return 'active'
  if (status === 'resolved') return 'resolved'
  if (status === 'ignored') return 'ignored'
  return 'active'
}

const getImpactLabel = (impact?: string) => {
  if (!impact) return ''
  if (impact === 'short') return 'Curto prazo'
  if (impact === 'medium') return 'Médio prazo'
  if (impact === 'long') return 'Longo prazo'
  return impact
}

const getPhaseLabel = (phase: string) => {
  if (phase === 'before') return 'Antes'
  if (phase === 'during') return 'Durante'
  if (phase === 'after') return 'Pós'
  return phase
}

function StoryEventPanel<TStoryEvent extends StoryEventBase>({
  storyEvents,
  storyEventForm,
  isStoryEventModalOpen,
  isStoryEventReadOnly,
  editingStoryEventId,
  relatedNotes = [],
  onCreate,
  onView,
  onEdit,
  onDelete,
  onCloseModal,
  onSave,
  setStoryEventForm
}: StoryEventPanelProps<TStoryEvent>) {
  return (
    <article className="dashboard-card story-events">
      <header>
        <h3>Eventos Narrativos</h3>
      </header>
      <ul className="event-list">
        {storyEvents.length === 0 ? (
          <li className="dashboard-empty">Nenhum evento cadastrado.</li>
        ) : (
          storyEvents.map((event) => {
            const statusLabel = getStatusLabel(event.status)
            const statusClass = getStatusClass(event.status)
            const impactLabel = getImpactLabel(event.impact)
            return (
              <li key={event.id} className="event-item">
                <div className="event-main">
                  <div className="event-badges">
                    <span className={`event-status ${statusClass}`}>{statusLabel}</span>
                    {impactLabel && <span className="event-impact">{impactLabel}</span>}
                  </div>
                  <strong>{event.title}</strong>
                  {event.description && <p className="event-description">{event.description}</p>}
                </div>
                <div className="event-actions">
                  <button
                    className="event-icon-btn"
                    onClick={() => onView(event)}
                    aria-label="Ver detalhes"
                    title="Detalhes"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    className="event-icon-btn"
                    onClick={() => onEdit(event)}
                    aria-label="Editar evento"
                    title="Editar"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                      <path d="M13 7l4 4" />
                    </svg>
                  </button>
                  <button
                    className="event-icon-btn danger"
                    onClick={() => onDelete(event.id)}
                    aria-label="Remover evento"
                    title="Remover"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 14h10l1-14" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </li>
            )
          })
        )}
      </ul>
      <button className="btn-secondary small" onClick={onCreate}>
        + Adicionar evento
      </button>

      {isStoryEventModalOpen && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h4>
                {editingStoryEventId
                  ? isStoryEventReadOnly
                    ? 'Detalhes do Evento'
                    : 'Editar Evento'
                  : 'Novo Evento'}
              </h4>
              <button className="modal-close" onClick={onCloseModal}>
                ✕
              </button>
            </div>
            <div className="player-form">
              <div className="player-form-section">
                <h5>Dados do evento</h5>
                <div className="player-form-grid">
                  <label className="field">
                    <span>Título</span>
                    <input
                      type="text"
                      value={storyEventForm.title}
                      readOnly={isStoryEventReadOnly}
                      onChange={(event) =>
                        setStoryEventForm({ ...storyEventForm, title: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <select
                      value={storyEventForm.status}
                      disabled={isStoryEventReadOnly}
                      onChange={(event) =>
                        setStoryEventForm({ ...storyEventForm, status: event.target.value })
                      }
                    >
                      <option value="active">Ativo</option>
                      <option value="resolved">Resolvido</option>
                      <option value="ignored">Ignorado</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Impacto</span>
                    <select
                      value={storyEventForm.impact}
                      disabled={isStoryEventReadOnly}
                      onChange={(event) =>
                        setStoryEventForm({ ...storyEventForm, impact: event.target.value })
                      }
                    >
                      <option value="">Não definido</option>
                      <option value="short">Curto prazo</option>
                      <option value="medium">Médio prazo</option>
                      <option value="long">Longo prazo</option>
                    </select>
                  </label>
                  <label className="field field-full">
                    <span>Descrição</span>
                    <textarea
                      value={storyEventForm.description}
                      readOnly={isStoryEventReadOnly}
                      onChange={(event) =>
                        setStoryEventForm({ ...storyEventForm, description: event.target.value })
                      }
                      rows={4}
                    />
                  </label>
                </div>
              </div>

              {isStoryEventReadOnly && relatedNotes.length > 0 && (
                <div className="player-form-section">
                  <h5>Notas de Sessão Relacionadas ({relatedNotes.length})</h5>
                  <div className="related-notes-list">
                    {relatedNotes.map((note) => (
                      <div key={note.id} className="related-note-item">
                        <div className="related-note-header">
                          <span className="related-note-phase">{getPhaseLabel(note.phase)}</span>
                          {note.session && (
                            <span className="related-note-session">
                              {note.session.title ||
                                new Date(note.session.startedAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <div className="related-note-content">{note.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="player-form-actions">
                <button className="btn-secondary" onClick={onCloseModal}>
                  {isStoryEventReadOnly ? 'Fechar' : 'Cancelar'}
                </button>
                {!isStoryEventReadOnly && (
                  <button className="btn-primary" onClick={onSave}>
                    {editingStoryEventId ? 'Salvar' : 'Criar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export default StoryEventPanel
