import type { Dispatch, SetStateAction } from 'react'

type NpcBase = {
  id: string
  name: string
  race?: string
  occupation?: string
  location?: string
  tags?: string
  notes?: string
}

type NpcForm = {
  name: string
  race: string
  occupation: string
  location: string
  tags: string
  notes: string
}

type NpcPanelProps<TNpc extends NpcBase> = {
  npcs: TNpc[]
  npcForm: NpcForm
  isNpcModalOpen: boolean
  isNpcReadOnly: boolean
  editingNpcId: string | null
  onCreate: () => void
  onView: (npc: TNpc) => void
  onEdit: (npc: TNpc) => void
  onDelete: (npcId: string) => void
  onCloseModal: () => void
  onSave: () => void
  setNpcForm: Dispatch<SetStateAction<NpcForm>>
}

function NpcPanel<TNpc extends NpcBase>({
  npcs,
  npcForm,
  isNpcModalOpen,
  isNpcReadOnly,
  editingNpcId,
  onCreate,
  onView,
  onEdit,
  onDelete,
  onCloseModal,
  onSave,
  setNpcForm
}: NpcPanelProps<TNpc>) {
  return (
    <article className="dashboard-card npcs">
      <header>
        <h3>NPCs da campanha</h3>
      </header>
      <div className="npc-grid">
        {npcs.length === 0 ? (
          <div className="dashboard-empty">Nenhum NPC cadastrado.</div>
        ) : (
          npcs.map((npc) => {
            const tagList = (npc.tags || '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
            return (
              <div key={npc.id} className="npc-card">
                <div className="npc-header">
                  <strong>{npc.name}</strong>
                  <span className="npc-location">{npc.location || 'Local desconhecido'}</span>
                </div>
                <div className="npc-meta">
                  <span>{npc.race || 'Raça desconhecida'}</span>
                  <span>{npc.occupation || 'Ocupação indefinida'}</span>
                </div>
                {tagList.length > 0 && (
                  <div className="npc-tags">
                    {tagList.map((tag) => (
                      <span key={tag} className="npc-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {npc.notes && <p className="npc-notes">{npc.notes}</p>}
                <div className="npc-actions">
                  <button
                    className="action-icon-btn"
                    onClick={() => onView(npc)}
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
                    onClick={() => onEdit(npc)}
                    aria-label="Editar NPC"
                    title="Editar"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                      <path d="M13 7l4 4" />
                    </svg>
                  </button>
                  <button
                    className="action-icon-btn danger"
                    onClick={() => onDelete(npc.id)}
                    aria-label="Remover NPC"
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
        <button className="npc-add" onClick={onCreate}>
          + Adicionar NPC
        </button>
      </div>

      {isNpcModalOpen && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h4>
                {editingNpcId
                  ? isNpcReadOnly
                    ? 'Detalhes do NPC'
                    : 'Editar NPC'
                  : 'Novo NPC'}
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
                      value={npcForm.name}
                      readOnly={isNpcReadOnly}
                      onChange={(event) => setNpcForm({ ...npcForm, name: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Raça</span>
                    <input
                      type="text"
                      value={npcForm.race}
                      readOnly={isNpcReadOnly}
                      onChange={(event) => setNpcForm({ ...npcForm, race: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Ocupação</span>
                    <input
                      type="text"
                      value={npcForm.occupation}
                      readOnly={isNpcReadOnly}
                      onChange={(event) => setNpcForm({ ...npcForm, occupation: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Local</span>
                    <input
                      type="text"
                      value={npcForm.location}
                      readOnly={isNpcReadOnly}
                      onChange={(event) => setNpcForm({ ...npcForm, location: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Tags (separadas por vírgula)</span>
                    <input
                      type="text"
                      value={npcForm.tags}
                      readOnly={isNpcReadOnly}
                      onChange={(event) => setNpcForm({ ...npcForm, tags: event.target.value })}
                    />
                  </label>
                </div>
              </div>
              <div className="player-form-section">
                <h5>Notas</h5>
                <label className="field">
                  <span>Observações</span>
                  <textarea
                    value={npcForm.notes}
                    readOnly={isNpcReadOnly}
                    onChange={(event) => setNpcForm({ ...npcForm, notes: event.target.value })}
                  />
                </label>
              </div>
              <div className="player-form-actions">
                <button className="btn-secondary" onClick={onCloseModal}>
                  {isNpcReadOnly ? 'Fechar' : 'Cancelar'}
                </button>
                {!isNpcReadOnly && (
                  <button className="btn-primary" onClick={onSave}>
                    {editingNpcId ? 'Salvar' : 'Criar'}
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

export default NpcPanel
