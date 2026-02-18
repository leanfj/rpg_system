import type { Dispatch, SetStateAction } from 'react'

type LocationBase = {
  id: string
  name: string
  description?: string
  status: string
  notes?: string
}

type LocationForm = {
  name: string
  description: string
  status: string
  notes: string
}

type SessionNote = {
  id: string
  sessionId: string
  phase: string
  content: string
  session?: { id: string; title?: string; startedAt: Date }
}

type LocationPanelProps<TLocation extends LocationBase> = {
  locations: TLocation[]
  locationForm: LocationForm
  isLocationModalOpen: boolean
  isLocationReadOnly: boolean
  editingLocationId: string | null
  relatedNotes?: SessionNote[]
  onCreate: () => void
  onView: (location: TLocation) => void
  onEdit: (location: TLocation) => void
  onDelete: (locationId: string) => void
  onCloseModal: () => void
  onSave: () => void
  setLocationForm: Dispatch<SetStateAction<LocationForm>>
}

const getStatusLabel = (status: string) => {
  if (status === 'unknown') return 'Desconhecido'
  if (status === 'safe') return 'Seguro'
  if (status === 'dangerous') return 'Perigoso'
  return status
}

const getStatusClass = (status: string) => {
  if (status === 'safe') return 'safe'
  if (status === 'dangerous') return 'dangerous'
  return 'unknown'
}

const getPhaseLabel = (phase: string) => {
  if (phase === 'before') return 'Antes'
  if (phase === 'during') return 'Durante'
  if (phase === 'after') return 'Pós'
  return phase
}

function LocationPanel<TLocation extends LocationBase>({
  locations,
  locationForm,
  isLocationModalOpen,
  isLocationReadOnly,
  editingLocationId,
  relatedNotes = [],
  onCreate,
  onView,
  onEdit,
  onDelete,
  onCloseModal,
  onSave,
  setLocationForm
}: LocationPanelProps<TLocation>) {
  return (
    <article className="dashboard-card locations">
      <header>
        <h3>Locais da campanha</h3>
      </header>
      <div className="location-grid">
        {locations.length === 0 ? (
          <div className="dashboard-empty">Nenhum local cadastrado.</div>
        ) : (
          locations.map((location) => {
            const statusLabel = getStatusLabel(location.status)
            const statusClass = getStatusClass(location.status)
            return (
              <div key={location.id} className="location-card">
                <div className="location-header">
                  <strong>{location.name}</strong>
                  <span className={`location-status ${statusClass}`}>{statusLabel}</span>
                </div>
                {location.description && (
                  <p className="location-description">{location.description}</p>
                )}
                {location.notes && <p className="location-notes">{location.notes}</p>}
                <div className="location-actions">
                  <button
                    className="action-icon-btn"
                    onClick={() => onView(location)}
                    aria-label="Ver detalhes"
                    title="Detalhes"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    className="action-icon-btn"
                    onClick={() => onEdit(location)}
                    aria-label="Editar local"
                    title="Editar"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                      <path d="M13 7l4 4" />
                    </svg>
                  </button>
                  <button
                    className="action-icon-btn danger"
                    onClick={() => onDelete(location.id)}
                    aria-label="Remover local"
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
              </div>
            )
          })
        )}
        <button className="location-add" onClick={onCreate}>
          + Adicionar Local
        </button>
      </div>

      {isLocationModalOpen && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h4>
                {editingLocationId
                  ? isLocationReadOnly
                    ? 'Detalhes do Local'
                    : 'Editar Local'
                  : 'Novo Local'}
              </h4>
              <button className="modal-close" onClick={onCloseModal}>
                ✕
              </button>
            </div>
            <div className="player-form">
              <div className="player-form-section">
                <h5>Informações básicas</h5>
                <div className="player-form-grid">
                  <label className="field">
                    <span>Nome</span>
                    <input
                      type="text"
                      value={locationForm.name}
                      readOnly={isLocationReadOnly}
                      onChange={(event) =>
                        setLocationForm({ ...locationForm, name: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <select
                      value={locationForm.status}
                      disabled={isLocationReadOnly}
                      onChange={(event) =>
                        setLocationForm({ ...locationForm, status: event.target.value })
                      }
                    >
                      <option value="unknown">Desconhecido</option>
                      <option value="safe">Seguro</option>
                      <option value="dangerous">Perigoso</option>
                    </select>
                  </label>
                  <label className="field field-full">
                    <span>Descrição</span>
                    <textarea
                      value={locationForm.description}
                      readOnly={isLocationReadOnly}
                      onChange={(event) =>
                        setLocationForm({ ...locationForm, description: event.target.value })
                      }
                      rows={3}
                    />
                  </label>
                </div>
              </div>
              <div className="player-form-section">
                <h5>Notas</h5>
                <label className="field">
                  <span>Observações</span>
                  <textarea
                    value={locationForm.notes}
                    readOnly={isLocationReadOnly}
                    onChange={(event) =>
                      setLocationForm({ ...locationForm, notes: event.target.value })
                    }
                    rows={3}
                  />
                </label>
              </div>

              {isLocationReadOnly && relatedNotes.length > 0 && (
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
                  {isLocationReadOnly ? 'Fechar' : 'Cancelar'}
                </button>
                {!isLocationReadOnly && (
                  <button className="btn-primary" onClick={onSave}>
                    {editingLocationId ? 'Salvar' : 'Criar'}
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

export default LocationPanel
