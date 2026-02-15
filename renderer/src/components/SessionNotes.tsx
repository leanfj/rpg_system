import { useEffect, useMemo, useState } from 'react'
import './SessionNotes.css'

interface SessionNote {
  id: string
  campaignId: string
  title: string
  sessionDate: Date
  recap?: string
  summary?: string
  locations?: string
  npcs?: string
  combats?: string
  moments?: string
  decisions?: string
  rewards?: string
  hooks?: string
  gmNotes?: string
  endTime?: string
  createdAt: Date
  updatedAt: Date
}

interface SessionNotesProps {
  campaignId: string
}

interface SessionNoteForm {
  title: string
  sessionDate: string
  recap: string
  summary: string
  locations: string
  npcs: string
  combats: string
  moments: string
  decisions: string
  rewards: string
  hooks: string
  gmNotes: string
  endTime: string
}

const createEmptyForm = (): SessionNoteForm => {
  const today = new Date()
  return {
    title: `Sessão ${today.toLocaleDateString('pt-BR')}`,
    sessionDate: today.toISOString().slice(0, 10),
    recap: '',
    summary: '',
    locations: '',
    npcs: '',
    combats: '',
    moments: '',
    decisions: '',
    rewards: '',
    hooks: '',
    gmNotes: '',
    endTime: ''
  }
}

const toDateInput = (value?: Date) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function SessionNotes({ campaignId }: SessionNotesProps) {
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [form, setForm] = useState<SessionNoteForm>(() => createEmptyForm())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [campaignId])

  const selectedNote = useMemo(() => {
    return notes.find((note) => note.id === selectedNoteId) || null
  }, [notes, selectedNoteId])

  const loadNotes = async () => {
    try {
      setIsLoading(true)
      const data = await window.electron.sessionNotes.getByCampaign(campaignId)
      setNotes(data)
      if (data.length > 0 && !selectedNoteId) {
        handleSelectNote(data[0])
      }
    } catch (error) {
      console.error('Erro ao carregar notas de sessão:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectNote = (note: SessionNote) => {
    setSelectedNoteId(note.id)
    setForm({
      title: note.title,
      sessionDate: toDateInput(note.sessionDate),
      recap: note.recap || '',
      summary: note.summary || '',
      locations: note.locations || '',
      npcs: note.npcs || '',
      combats: note.combats || '',
      moments: note.moments || '',
      decisions: note.decisions || '',
      rewards: note.rewards || '',
      hooks: note.hooks || '',
      gmNotes: note.gmNotes || '',
      endTime: note.endTime || ''
    })
  }

  const handleNewNote = () => {
    setSelectedNoteId(null)
    setForm(createEmptyForm())
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const payload = {
        title: form.title.trim() || 'Sessão sem título',
        sessionDate: form.sessionDate ? new Date(`${form.sessionDate}T00:00:00`) : new Date(),
        recap: form.recap.trim() || undefined,
        summary: form.summary.trim() || undefined,
        locations: form.locations.trim() || undefined,
        npcs: form.npcs.trim() || undefined,
        combats: form.combats.trim() || undefined,
        moments: form.moments.trim() || undefined,
        decisions: form.decisions.trim() || undefined,
        rewards: form.rewards.trim() || undefined,
        hooks: form.hooks.trim() || undefined,
        gmNotes: form.gmNotes.trim() || undefined,
        endTime: form.endTime.trim() || undefined
      }

      if (selectedNoteId) {
        const updated = await window.electron.sessionNotes.update(selectedNoteId, payload)
        setNotes((prev) => prev.map((note) => (note.id === updated.id ? updated : note)))
      } else {
        const created = await window.electron.sessionNotes.create({
          campaignId,
          ...payload
        })
        setNotes((prev) => [created, ...prev])
        setSelectedNoteId(created.id)
      }
    } catch (error) {
      console.error('Erro ao salvar nota de sessão:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedNoteId) return
    if (!confirm('Deseja remover esta nota de sessão?')) return

    try {
      await window.electron.sessionNotes.delete(selectedNoteId)
      const updated = notes.filter((note) => note.id !== selectedNoteId)
      setNotes(updated)
      setSelectedNoteId(updated[0]?.id || null)
      if (updated[0]) {
        handleSelectNote(updated[0])
      } else {
        setForm(createEmptyForm())
      }
    } catch (error) {
      console.error('Erro ao remover nota de sessão:', error)
    }
  }

  const formatDateTime = (value?: Date) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('pt-BR')
  }

  return (
    <div className="session-notes">
      <header className="session-notes-header">
        <div>
          <h2>Notas da Sessão</h2>
          <p className="text-muted">Registre o conteúdo das sessões jogadas.</p>
        </div>
        <div className="session-notes-actions">
          <button className="btn-secondary" onClick={loadNotes} disabled={isLoading}>
            Atualizar
          </button>
          <button className="btn-secondary" onClick={handleNewNote}>
            Nova nota
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar nota'}
          </button>
        </div>
      </header>

      <div className="session-notes-body">
        <aside className="session-notes-list">
          {isLoading ? (
            <div className="session-notes-empty">Carregando notas...</div>
          ) : notes.length === 0 ? (
            <div className="session-notes-empty">Nenhuma nota registrada.</div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                className={`session-note-item ${note.id === selectedNoteId ? 'active' : ''}`}
                onClick={() => handleSelectNote(note)}
              >
                <div className="session-note-title">{note.title}</div>
                <div className="session-note-meta">
                  <span>{new Date(note.sessionDate).toLocaleDateString('pt-BR')}</span>
                  <span>Atualizado: {formatDateTime(note.updatedAt)}</span>
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="session-notes-editor">
          <div className="session-notes-info">
            <div>
              <strong>Arquivo criado em:</strong> {formatDateTime(selectedNote?.createdAt)}
            </div>
            <div>
              <strong>Última modificação:</strong> {formatDateTime(selectedNote?.updatedAt)}
            </div>
            {selectedNoteId && (
              <button className="btn-danger" onClick={handleDelete}>
                Remover nota
              </button>
            )}
          </div>

          <div className="session-notes-grid">
            <label className="field">
              <span>Título da sessão</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Data da sessão</span>
              <input
                type="date"
                value={form.sessionDate}
                onChange={(event) => setForm({ ...form, sessionDate: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Registro hora final de sessão</span>
              <input
                type="text"
                value={form.endTime}
                onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                placeholder="Ex: 23:40"
              />
            </label>

            <label className="field">
              <span>Recap da sessão anterior</span>
              <textarea
                rows={3}
                value={form.recap}
                onChange={(event) => setForm({ ...form, recap: event.target.value })}
              />
            </label>

            <label className="field">
              <span>O que rolou</span>
              <textarea
                rows={4}
                value={form.summary}
                onChange={(event) => setForm({ ...form, summary: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Locais visitados</span>
              <textarea
                rows={3}
                value={form.locations}
                onChange={(event) => setForm({ ...form, locations: event.target.value })}
              />
            </label>

            <label className="field">
              <span>NPCs importantes</span>
              <textarea
                rows={3}
                value={form.npcs}
                onChange={(event) => setForm({ ...form, npcs: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Combates e acontecimentos</span>
              <textarea
                rows={3}
                value={form.combats}
                onChange={(event) => setForm({ ...form, combats: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Momentos memoráveis</span>
              <textarea
                rows={3}
                value={form.moments}
                onChange={(event) => setForm({ ...form, moments: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Decisões importantes</span>
              <textarea
                rows={3}
                value={form.decisions}
                onChange={(event) => setForm({ ...form, decisions: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Recompensas e achados</span>
              <textarea
                rows={3}
                value={form.rewards}
                onChange={(event) => setForm({ ...form, rewards: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Ganchos para a próxima sessão</span>
              <textarea
                rows={3}
                value={form.hooks}
                onChange={(event) => setForm({ ...form, hooks: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Notas do mestre</span>
              <textarea
                rows={4}
                value={form.gmNotes}
                onChange={(event) => setForm({ ...form, gmNotes: event.target.value })}
              />
            </label>

          </div>
        </section>
      </div>
    </div>
  )
}

export default SessionNotes
