import { useEffect, useState } from 'react'

interface SessionNotesPanelProps {
  campaignId: string
  sessions: Array<{ id: string; title?: string; startedAt: Date; status: string }>
  npcs: Array<{ id: string; name: string }>
  players: Array<{ id: string; name: string }>
  quests: Array<{ id: string; title: string }>
  locations: Array<{ id: string; name: string }>
  storyEvents: Array<{ id: string; title: string }>
  onReloadSessions?: () => void
}

interface SessionNote {
  id: string
  sessionId: string
  phase: string
  content: string
  importance: string
  order: number
  npcs?: Array<{ id: string; npc: { id: string; name: string } }>
  players?: Array<{ id: string; player: { id: string; name: string } }>
  quests?: Array<{ id: string; quest: { id: string; title: string } }>
  locations?: Array<{ id: string; location: { id: string; name: string } }>
  events?: Array<{ id: string; event: { id: string; title: string } }>
}

type Phase = 'before' | 'during' | 'after'

const PHASE_LABELS: Record<Phase, string> = {
  before: 'Antes da Sessão',
  during: 'Durante a Sessão',
  after: 'Pós-Sessão'
}

function SessionNotesPanel({
  campaignId,
  sessions,
  npcs,
  players,
  quests,
  locations,
  storyEvents,
  onReloadSessions
}: SessionNotesPanelProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [currentPhase, setCurrentPhase] = useState<Phase>('before')
  const [noteForm, setNoteForm] = useState({
    content: '',
    importance: 'normal',
    npcIds: [] as string[],
    playerIds: [] as string[],
    questIds: [] as string[],
    locationIds: [] as string[],
    eventIds: [] as string[]
  })

  // Carrega notas quando sessao muda
  useEffect(() => {
    if (selectedSessionId) {
      loadNotes(selectedSessionId)
    } else {
      setNotes([])
    }
  }, [selectedSessionId])

  const loadNotes = async (sessionId: string) => {
    try {
      const data = await window.electron.sessionNotes.getBySession(sessionId)
      setNotes(data)
    } catch (error) {
      console.error('Erro ao carregar notas:', error)
    }
  }

  const openCreateNote = (phase: Phase) => {
    setEditingNoteId(null)
    setCurrentPhase(phase)
    setNoteForm({
      content: '',
      importance: 'normal',
      npcIds: [],
      playerIds: [],
      questIds: [],
      locationIds: [],
      eventIds: []
    })
    setIsModalOpen(true)
  }

  const openEditNote = (note: SessionNote) => {
    setEditingNoteId(note.id)
    setCurrentPhase(note.phase as Phase)
    setNoteForm({
      content: note.content,
      importance: note.importance,
      npcIds: note.npcs?.map((n) => n.npc.id) || [],
      playerIds: note.players?.map((p) => p.player.id) || [],
      questIds: note.quests?.map((q) => q.quest.id) || [],
      locationIds: note.locations?.map((l) => l.location.id) || [],
      eventIds: note.events?.map((e) => e.event.id) || []
    })
    setIsModalOpen(true)
  }

  const handleSaveNote = async () => {
    if (!selectedSessionId || !noteForm.content.trim()) return

    try {
      const connections = {
        npcIds: noteForm.npcIds,
        playerIds: noteForm.playerIds,
        questIds: noteForm.questIds,
        locationIds: noteForm.locationIds,
        eventIds: noteForm.eventIds
      }

      if (editingNoteId) {
        await window.electron.sessionNotes.update(editingNoteId, {
          content: noteForm.content,
          importance: noteForm.importance,
          connections
        })
      } else {
        const maxOrder = notes
          .filter((n) => n.phase === currentPhase)
          .reduce((max, n) => Math.max(max, n.order), -1)
        
        await window.electron.sessionNotes.create({
          sessionId: selectedSessionId,
          phase: currentPhase,
          content: noteForm.content,
          importance: noteForm.importance,
          order: maxOrder + 1,
          connections
        })
      }

      await loadNotes(selectedSessionId)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar nota:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Remover esta nota?')) return

    try {
      await window.electron.sessionNotes.delete(noteId)
      if (selectedSessionId) {
        await loadNotes(selectedSessionId)
      }
    } catch (error) {
      console.error('Erro ao remover nota:', error)
    }
  }

  const handleCreateSession = async () => {
    if (!campaignId) return
    
    try {
      const newSession = await window.electron.sessions.start(campaignId)
      setSelectedSessionId(newSession.id)
      onReloadSessions?.()
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
    }
  }

  const toggleConnection = (type: 'npcIds' | 'playerIds' | 'questIds' | 'locationIds' | 'eventIds', id: string) => {
    setNoteForm((prev) => {
      const currentIds = prev[type]
      const isSelected = currentIds.includes(id)
      return {
        ...prev,
        [type]: isSelected ? currentIds.filter((i) => i !== id) : [...currentIds, id]
      }
    })
  }

  const notesByPhase = (phase: Phase) => notes.filter((n) => n.phase === phase)

  const renderNoteCard = (note: SessionNote) => (
    <div key={note.id} className={`session-note-card ${note.importance === 'high' ? 'high' : ''}`}>
      <div className="session-note-content">{note.content}</div>
      {(note.npcs?.length || note.players?.length || note.quests?.length || note.locations?.length || note.events?.length) ? (
        <div className="session-note-connections">
          {note.npcs?.map((n) => (
            <span key={n.id} className="connection-tag npc">
              👤 {n.npc.name}
            </span>
          ))}
          {note.players?.map((p) => (
            <span key={p.id} className="connection-tag player">
              ⚔️ {p.player.name}
            </span>
          ))}
          {note.quests?.map((q) => (
            <span key={q.id} className="connection-tag quest">
              📜 {q.quest.title}
            </span>
          ))}
          {note.locations?.map((l) => (
            <span key={l.id} className="connection-tag location">
              📍 {l.location.name}
            </span>
          ))}
          {note.events?.map((e) => (
            <span key={e.id} className="connection-tag event">
              ⚡ {e.event.title}
            </span>
          ))}
        </div>
      ) : null}
      <div className="session-note-actions">
        <button className="btn-icon" onClick={() => openEditNote(note)} title="Editar">
          ✏️
        </button>
        <button className="btn-icon danger" onClick={() => handleDeleteNote(note.id)} title="Remover">
          🗑️
        </button>
      </div>
    </div>
  )

  return (
    <article className="dashboard-card session-notes">
      <header>
        <h3>Notas de Sessão</h3>
        <div className="session-selector">
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value || null)}
          >
            <option value="">Selecionar sessão...</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title || `Sessão ${new Date(session.startedAt).toLocaleDateString('pt-BR')}`}
              </option>
            ))}
          </select>
          <button className="btn-secondary small" onClick={handleCreateSession}>
            + Nova Sessão
          </button>
        </div>
      </header>

      {selectedSessionId ? (
        <div className="session-notes-phases">
          {(['before', 'during', 'after'] as Phase[]).map((phase) => (
            <div key={phase} className="session-notes-phase">
              <div className="phase-header">
                <h4>{PHASE_LABELS[phase]}</h4>
                <button className="btn-add-note" onClick={() => openCreateNote(phase)}>
                  + Adicionar
                </button>
              </div>
              <div className="session-notes-list">
                {notesByPhase(phase).length === 0 ? (
                  <p className="text-muted">Nenhuma nota nesta fase.</p>
                ) : (
                  notesByPhase(phase).map(renderNoteCard)
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty">Selecione ou crie uma sessão para gerenciar as notas.</div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal session-note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editingNoteId ? 'Editar Nota' : `Nova Nota - ${PHASE_LABELS[currentPhase]}`}</h4>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="player-form">
              <div className="player-form-section">
                <label className="field">
                  <span>Conteúdo</span>
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    rows={4}
                    placeholder="Escreva sua nota aqui..."
                  />
                </label>
                <label className="field">
                  <span>Importância</span>
                  <select
                    value={noteForm.importance}
                    onChange={(e) => setNoteForm({ ...noteForm, importance: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </label>
              </div>

              <div className="player-form-section">
                <h5>Conexões</h5>
                {npcs.length > 0 && (
                  <div className="connection-group">
                    <strong>NPCs</strong>
                    <div className="connection-checkboxes">
                      {npcs.map((npc) => (
                        <label key={npc.id} className="connection-checkbox">
                          <input
                            type="checkbox"
                            checked={noteForm.npcIds.includes(npc.id)}
                            onChange={() => toggleConnection('npcIds', npc.id)}
                          />
                          <span>{npc.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {players.length > 0 && (
                  <div className="connection-group">
                    <strong>Jogadores</strong>
                    <div className="connection-checkboxes">
                      {players.map((player) => (
                        <label key={player.id} className="connection-checkbox">
                          <input
                            type="checkbox"
                            checked={noteForm.playerIds.includes(player.id)}
                            onChange={() => toggleConnection('playerIds', player.id)}
                          />
                          <span>{player.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {quests.length > 0 && (
                  <div className="connection-group">
                    <strong>Quests</strong>
                    <div className="connection-checkboxes">
                      {quests.map((quest) => (
                        <label key={quest.id} className="connection-checkbox">
                          <input
                            type="checkbox"
                            checked={noteForm.questIds.includes(quest.id)}
                            onChange={() => toggleConnection('questIds', quest.id)}
                          />
                          <span>{quest.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {locations.length > 0 && (
                  <div className="connection-group">
                    <strong>Locais</strong>
                    <div className="connection-checkboxes">
                      {locations.map((location) => (
                        <label key={location.id} className="connection-checkbox">
                          <input
                            type="checkbox"
                            checked={noteForm.locationIds.includes(location.id)}
                            onChange={() => toggleConnection('locationIds', location.id)}
                          />
                          <span>{location.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {storyEvents.length > 0 && (
                  <div className="connection-group">
                    <strong>Eventos</strong>
                    <div className="connection-checkboxes">
                      {storyEvents.map((event) => (
                        <label key={event.id} className="connection-checkbox">
                          <input
                            type="checkbox"
                            checked={noteForm.eventIds.includes(event.id)}
                            onChange={() => toggleConnection('eventIds', event.id)}
                          />
                          <span>{event.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="player-form-actions">
                <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSaveNote}
                  disabled={!noteForm.content.trim()}
                >
                  {editingNoteId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export default SessionNotesPanel
