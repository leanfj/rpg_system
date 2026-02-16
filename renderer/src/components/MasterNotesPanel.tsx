type MasterNote = {
  content?: string
}

type MasterNotesPanelProps = {
  masterNote?: MasterNote | null
  isOpen: boolean
  masterNoteContent: string
  onOpen: () => void
  onClose: () => void
  onSave: () => void
  setMasterNoteContent: (value: string) => void
}

function MasterNotesPanel({
  masterNote,
  isOpen,
  masterNoteContent,
  onOpen,
  onClose,
  onSave,
  setMasterNoteContent
}: MasterNotesPanelProps) {
  return (
    <article className="dashboard-card notes">
      <header>
        <h3>Anotações do mestre</h3>
      </header>
      <div className="note-box">
        {masterNote?.content ? (
          <pre className="master-note-preview">{masterNote.content}</pre>
        ) : (
          <p className="text-muted">Nenhuma anotação salva.</p>
        )}
      </div>
      <button className="btn-secondary small" onClick={onOpen}>
        {masterNote?.content ? 'Editar anotações' : 'Adicionar anotações'}
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h4>Anotações do mestre</h4>
              <button className="modal-close" onClick={onClose}>
                ✕
              </button>
            </div>
            <div className="player-form">
              <div className="player-form-section">
                <label className="field">
                  <textarea
                    className="master-note-textarea"
                    value={masterNoteContent}
                    onChange={(event) => setMasterNoteContent(event.target.value)}
                  />
                </label>
              </div>
              <div className="player-form-actions">
                <button className="btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={onSave}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export default MasterNotesPanel
