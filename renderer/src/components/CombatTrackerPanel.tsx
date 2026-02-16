import type { InitiativeEntry } from '../hooks/useCombatTracker'

type MonsterBase = {
  name: string
  armor_class: Array<{ value: number }>
}

type SavedEncounterBase = {
  id: string
  name: string
}

type TurnMonitorBase<TEncounter extends SavedEncounterBase> = {
  encounters: TEncounter[]
}

type CombatTrackerPanelProps<
  TMonitor extends TurnMonitorBase<TEncounter>,
  TMonster extends MonsterBase,
  TEncounter extends SavedEncounterBase
> = {
  initiativeList: InitiativeEntry<TMonster>[]
  currentTurnIndex: number
  selectedEncounterId: string
  selectedEncounter: TEncounter | null
  turnMonitor: TMonitor
  srdMonsters: TMonster[]
  conditionOptions: string[]
  getInitiativeTypeLabel: (entry: InitiativeEntry<TMonster>) => string
  isEntryDead: (entry: InitiativeEntry<TMonster>) => boolean
  openCustomInitiative: () => void
  resetCombat: () => void
  previousTurn: () => void
  nextTurn: () => void
  setSelectedEncounterId: (value: string) => void
  loadEncounter: () => void
  openCreateEncounter: () => void
  openUpdateEncounter: () => void
  removeEncounter: () => void
  updateInitiativeValue: (id: string, value: number) => void
  updateInitiativeCondition: (id: string, value: string) => void
  openHpAdjust: (entry: InitiativeEntry<TMonster>, mode: 'sub' | 'add') => void
  duplicateInitiativeEntry: (entry: InitiativeEntry<TMonster>) => void
  removeFromInitiative: (id: string) => void
  openMonsterStats: (monster: TMonster, event?: { clientX: number; clientY: number }) => void
}

function CombatTrackerPanel<
  TMonitor extends TurnMonitorBase<TEncounter>,
  TMonster extends MonsterBase,
  TEncounter extends SavedEncounterBase
>({
  initiativeList,
  currentTurnIndex,
  selectedEncounterId,
  selectedEncounter,
  turnMonitor,
  srdMonsters,
  conditionOptions,
  getInitiativeTypeLabel,
  isEntryDead,
  openCustomInitiative,
  resetCombat,
  previousTurn,
  nextTurn,
  setSelectedEncounterId,
  loadEncounter,
  openCreateEncounter,
  openUpdateEncounter,
  removeEncounter,
  updateInitiativeValue,
  updateInitiativeCondition,
  openHpAdjust,
  duplicateInitiativeEntry,
  removeFromInitiative,
  openMonsterStats
}: CombatTrackerPanelProps<TMonitor, TMonster, TEncounter>) {
  return (
    <article className="dashboard-card combat-tracker">
      <header>
        <h3>Tracker de Combate</h3>
        <div className="combat-tracker-header-actions">
          <button
            className="action-icon-btn initiative"
            onClick={openCustomInitiative}
            title="Adicionar criatura ou NPC"
            aria-label="Adicionar criatura ou NPC"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
          {initiativeList.length > 0 && (
            <button className="btn-secondary small danger" onClick={resetCombat}>
              Encerrar Combate
            </button>
          )}
        </div>
      </header>

      {initiativeList.length === 0 ? (
        <div className="combat-tracker-empty">
          <p>Nenhuma criatura na iniciativa.</p>
          <p className="text-muted">
            Use os botões de espada nos cards de personagens, nos monstros fixados ou na lista de criaturas para adicionar participantes ao combate.
          </p>
        </div>
      ) : (
        <div className="combat-tracker-content">
          <div className="combat-tracker-controls">
            <button className="btn-secondary small" onClick={previousTurn} disabled={initiativeList.length === 0}>
              ← Anterior
            </button>
            <span className="combat-tracker-round">
              Turno de: <strong>{initiativeList[currentTurnIndex]?.name || '-'}</strong>
            </span>
            <button className="btn-secondary small" onClick={nextTurn} disabled={initiativeList.length === 0}>
              Próximo →
            </button>
          </div>
          <div className="combat-tracker-encounters">
            <select
              value={selectedEncounterId}
              onChange={(event) => setSelectedEncounterId(event.target.value)}
              aria-label="Selecionar encontro salvo"
            >
              <option value="">Encontros salvos...</option>
              {turnMonitor.encounters.map((encounter) => (
                <option key={encounter.id} value={encounter.id}>
                  {encounter.name}
                </option>
              ))}
            </select>
            <button
              className="btn-secondary small"
              onClick={loadEncounter}
              disabled={!selectedEncounter}
            >
              Carregar
            </button>
            <button
              className="btn-secondary small"
              onClick={openCreateEncounter}
              disabled={initiativeList.length === 0}
            >
              Salvar
            </button>
            <button
              className="btn-secondary small"
              onClick={openUpdateEncounter}
              disabled={!selectedEncounter || initiativeList.length === 0}
            >
              Atualizar
            </button>
            <button
              className="btn-secondary small danger"
              onClick={removeEncounter}
              disabled={!selectedEncounter}
            >
              Remover
            </button>
          </div>

          <div className="combat-tracker-list">
            {initiativeList.map((entry, index) => {
              const isDead = isEntryDead(entry)
              const monsterSource = entry.monsterData || srdMonsters.find((monster) => monster.name === entry.name)
              const canOpenStats = Boolean(monsterSource)
              const canDuplicate = Boolean(entry.side) || entry.type === 'monster'
              return (
                <div
                  key={entry.id}
                  className={`combat-tracker-entry ${index === currentTurnIndex ? 'active' : ''} ${entry.type} ${isDead ? 'dead' : ''}`}
                >
                  <div className="combat-tracker-entry-initiative">
                    <input
                      className="initiative-input"
                      type="number"
                      value={entry.initiative}
                      min={0}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value)
                        if (Number.isNaN(nextValue)) return
                        updateInitiativeValue(entry.id, nextValue)
                      }}
                      aria-label={`Iniciativa de ${entry.name}`}
                    />
                  </div>
                  <div className="combat-tracker-entry-info">
                    <div className="combat-tracker-entry-name">
                      {entry.name}
                      {isDead && (
                        <span className="combat-tracker-entry-dead">Morto</span>
                      )}
                      <span className={`combat-tracker-entry-type ${entry.type}`}>
                        {getInitiativeTypeLabel(entry)}
                      </span>
                    </div>
                    {(entry.hp !== undefined && entry.maxHp !== undefined) && (
                      <div className="combat-tracker-entry-stats">
                        <div className="combat-tracker-hp">
                          <span>PV: {entry.hp}/{entry.maxHp}</span>
                          <div className="combat-tracker-hp-controls">
                            <button
                              className="combat-hp-btn"
                              onClick={() => openHpAdjust(entry, 'sub')}
                              aria-label="Reduzir PV"
                            >
                              -
                            </button>
                            <button
                              className="combat-hp-btn"
                              onClick={() => openHpAdjust(entry, 'add')}
                              aria-label="Aumentar PV"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {entry.ac !== undefined && (
                          <span className="combat-tracker-ac">CA: {entry.ac}</span>
                        )}
                      </div>
                    )}
                    <div className="combat-tracker-condition">
                      <select
                        value={entry.condition ?? ''}
                        onChange={(event) => updateInitiativeCondition(entry.id, event.target.value)}
                        aria-label={`Condição de ${entry.name}`}
                      >
                        <option value="">Sem condição</option>
                        {conditionOptions.map((condition) => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="combat-tracker-entry-actions">
                    {canOpenStats && monsterSource && (
                      <button
                        className="action-icon-btn"
                        onClick={(event) => openMonsterStats(monsterSource, event)}
                          title="Abrir estatísticas"
                          aria-label="Abrir estatísticas"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                      </button>
                    )}
                    {canDuplicate && (
                      <button
                        className="action-icon-btn"
                        onClick={() => duplicateInitiativeEntry(entry)}
                        title="Duplicar entrada"
                        aria-label="Duplicar entrada"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M8 8h10v10H8z" />
                          <path d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="action-icon-btn danger"
                      onClick={() => removeFromInitiative(entry.id)}
                      title="Remover da iniciativa"
                      aria-label="Remover da iniciativa"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}

export default CombatTrackerPanel
