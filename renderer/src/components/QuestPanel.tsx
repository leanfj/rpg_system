import type { Dispatch, SetStateAction } from 'react'

type QuestBase = {
  id: string
  title: string
  status: string
  objective?: string
  reward?: string
  notes?: string
}

type QuestForm = {
  title: string
  status: string
  objective: string
  reward: string
  notes: string
}

type QuestPanelProps<TQuest extends QuestBase> = {
  quests: TQuest[]
  questForm: QuestForm
  isQuestModalOpen: boolean
  isQuestReadOnly: boolean
  editingQuestId: string | null
  onCreate: () => void
  onView: (quest: TQuest) => void
  onEdit: (quest: TQuest) => void
  onDelete: (questId: string) => void
  onCloseModal: () => void
  onSave: () => void
  setQuestForm: Dispatch<SetStateAction<QuestForm>>
}

const getQuestStatusLabel = (status: string) => {
  if (status === 'open') return 'Em aberto'
  if (status === 'in_progress') return 'Em andamento'
  if (status === 'done') return 'Concluida'
  if (status === 'failed') return 'Falhou'
  return status
}

const getQuestStatusClass = (status: string) => {
  if (status === 'open') return 'open'
  if (status === 'in_progress') return 'progress'
  if (status === 'done') return 'done'
  if (status === 'failed') return 'failed'
  return 'open'
}

function QuestPanel<TQuest extends QuestBase>({
  quests,
  questForm,
  isQuestModalOpen,
  isQuestReadOnly,
  editingQuestId,
  onCreate,
  onView,
  onEdit,
  onDelete,
  onCloseModal,
  onSave,
  setQuestForm
}: QuestPanelProps<TQuest>) {
  return (
    <article className="dashboard-card quests">
      <header>
        <h3>Quest log</h3>
      </header>
      <ul className="quest-list">
        {quests.length === 0 ? (
          <li className="dashboard-empty">Nenhuma quest cadastrada.</li>
        ) : (
          quests.map((quest) => {
            const statusLabel = getQuestStatusLabel(quest.status)
            const statusClass = getQuestStatusClass(quest.status)
            return (
              <li key={quest.id} className="quest-item">
                <div className="quest-main">
                  <span className={`quest-status ${statusClass}`}>{statusLabel}</span>
                  <strong>{quest.title}</strong>
                </div>
                <div className="quest-actions">
                  <button
                    className="quest-icon-btn"
                    onClick={() => onView(quest)}
                    aria-label="Ver detalhes"
                    title="Detalhes"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    className="quest-icon-btn"
                    onClick={() => onEdit(quest)}
                    aria-label="Editar quest"
                    title="Editar"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                      <path d="M13 7l4 4" />
                    </svg>
                  </button>
                  <button
                    className="quest-icon-btn danger"
                    onClick={() => onDelete(quest.id)}
                    aria-label="Remover quest"
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
        + Adicionar quest
      </button>

      {isQuestModalOpen && (
        <div className="modal-overlay" onClick={onCloseModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h4>
                {editingQuestId
                  ? isQuestReadOnly
                    ? 'Detalhes da quest'
                    : 'Editar quest'
                  : 'Nova quest'}
              </h4>
              <button className="modal-close" onClick={onCloseModal}>
                ✕
              </button>
            </div>
            <div className="player-form">
              <div className="player-form-section">
                <h5>Dados da quest</h5>
                <div className="player-form-grid">
                  <label className="field">
                    <span>Titulo</span>
                    <input
                      type="text"
                      value={questForm.title}
                      readOnly={isQuestReadOnly}
                      onChange={(event) => setQuestForm({ ...questForm, title: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <select
                      value={questForm.status}
                      disabled={isQuestReadOnly}
                      onChange={(event) => setQuestForm({ ...questForm, status: event.target.value })}
                    >
                      <option value="open">Em aberto</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="done">Concluida</option>
                      <option value="failed">Falhou</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Objetivo</span>
                    <input
                      type="text"
                      value={questForm.objective}
                      readOnly={isQuestReadOnly}
                      onChange={(event) => setQuestForm({ ...questForm, objective: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Recompensa</span>
                    <input
                      type="text"
                      value={questForm.reward}
                      readOnly={isQuestReadOnly}
                      onChange={(event) => setQuestForm({ ...questForm, reward: event.target.value })}
                    />
                  </label>
                </div>
              </div>
              <div className="player-form-section">
                <h5>Notas</h5>
                <label className="field">
                  <span>Observações</span>
                  <textarea
                    value={questForm.notes}
                    readOnly={isQuestReadOnly}
                    onChange={(event) => setQuestForm({ ...questForm, notes: event.target.value })}
                  />
                </label>
              </div>
              <div className="player-form-actions">
                <button className="btn-secondary" onClick={onCloseModal}>
                  {isQuestReadOnly ? 'Fechar' : 'Cancelar'}
                </button>
                {!isQuestReadOnly && (
                  <button className="btn-primary" onClick={onSave}>
                    {editingQuestId ? 'Salvar' : 'Criar'}
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

export default QuestPanel
