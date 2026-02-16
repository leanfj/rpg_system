import type { Dispatch, SetStateAction } from 'react'
import type { InitiativeTargetEntry } from '../hooks/useCombatTracker'

type TurnsPeriod<TPeriod extends string> = {
  id: TPeriod
  label: string
}

type TurnsRow = {
  effect: string
  duration: string
}

type PvRow = {
  name: string
  max: string
  current: string
}

type MonsterRow = {
  group: string
  area: string
  notes: string
}

type EncounterEnvironmentOption<TEnvironment extends string> = {
  id: TEnvironment
  label: string
}

type EncounterDifficultyOption<TDifficulty extends string> = {
  id: TDifficulty
  label: string
}

type ReactionRow = {
  roll: string
  result: string
}

type MonsterBase = {
  index: string
  name: string
  challenge_rating: number | string
  hit_points: number
  armor_class: Array<{ value: number }>
}

type TurnMonitorBase<TPeriod extends string, TEnvironment extends string, TDifficulty extends string> = {
  periods: Record<TPeriod, boolean[][]>
  orderOfMarch: string
  orderOfWatch: string
  actions: boolean[]
  effectRows: TurnsRow[]
  pvRows: PvRow[]
  monsterRows: MonsterRow[]
  encounterTable: string[]
  encounterTable20: string[]
  encounterEnvironment: TEnvironment
  encounterDifficulty: TDifficulty
}

type TurnsPanelProps<
  TMonitor extends TurnMonitorBase<TPeriod, TEnvironment, TDifficulty>,
  TPeriod extends string,
  TEnvironment extends string,
  TDifficulty extends string,
  TMonster extends MonsterBase
> = {
  turnMonitor: TMonitor
  turnMonitorStatusLabel: string
  turnMonitorStatus: string
  saveTurnMonitor: (data: TMonitor, showStatus?: boolean) => void
  setTurnMonitor: Dispatch<SetStateAction<TMonitor>>
  updateTurnPeriod: (periodId: TPeriod, rowIndex: number, columnIndex: number, checked: boolean) => void
  updateTurnAction: (actionIndex: number, checked: boolean) => void
  updateEncounterTable: (index: number, value: string) => void
  updateEncounterTable20: (index: number, value: string) => void
  fillEncounterTable: () => void
  fillEncounterTable20: () => void
  updatePvRow: (index: number, key: keyof PvRow, value: string) => void
  updateMonsterRow: (index: number, key: keyof MonsterRow, value: string) => void
  updateEffectRow: (index: number, key: keyof TurnsRow, value: string) => void
  setOrderOfMarch: (value: string) => void
  setOrderOfWatch: (value: string) => void
  turnPeriods: TurnsPeriod<TPeriod>[]
  turnRows: number[]
  turnColumns: number[]
  dungeonActions: string[]
  reactionTable: ReactionRow[]
  encounterEnvironments: EncounterEnvironmentOption<TEnvironment>[]
  encounterDifficulties: EncounterDifficultyOption<TDifficulty>[]
  encounterRolls: string[]
  encounterRolls20: string[]
  srdMonsters: TMonster[]
  openMonsterStats: (monster: TMonster, event?: { clientX: number; clientY: number }) => void
  openAddToInitiative: (entry: InitiativeTargetEntry<TMonster>) => void
}

function TurnsPanel<
  TMonitor extends TurnMonitorBase<TPeriod, TEnvironment, TDifficulty>,
  TPeriod extends string,
  TEnvironment extends string,
  TDifficulty extends string,
  TMonster extends MonsterBase
>({
  turnMonitor,
  turnMonitorStatusLabel,
  turnMonitorStatus,
  saveTurnMonitor,
  setTurnMonitor,
  updateTurnPeriod,
  updateTurnAction,
  updateEncounterTable,
  updateEncounterTable20,
  fillEncounterTable,
  fillEncounterTable20,
  updatePvRow,
  updateMonsterRow,
  updateEffectRow,
  setOrderOfMarch,
  setOrderOfWatch,
  turnPeriods,
  turnRows,
  turnColumns,
  dungeonActions,
  reactionTable,
  encounterEnvironments,
  encounterDifficulties,
  encounterRolls,
  encounterRolls20,
  srdMonsters,
  openMonsterStats,
  openAddToInitiative
}: TurnsPanelProps<TMonitor, TPeriod, TEnvironment, TDifficulty, TMonster>) {
  return (
    <article className="dashboard-card turns">
      <header>
        <h3>Monitoramento de turnos</h3>
        <div className="turns-header-actions">
          <button className="btn-secondary small" onClick={() => saveTurnMonitor(turnMonitor)}>
            Salvar
          </button>
          {turnMonitorStatusLabel && (
            <span className={`turns-status ${turnMonitorStatus}`}>
              {turnMonitorStatusLabel}
            </span>
          )}
        </div>
      </header>
      <div className="turns-grid">
        <div className="turns-column">
          <div className="turns-section">
            <h4>Marcando turnos</h4>
            <div className="turns-periods">
              {turnPeriods.map((period) => (
                <div key={period.id} className="turns-period">
                  <span>{period.label}</span>
                  <div className="turns-slot-grid">
                    <div className="turns-slot-row turns-slot-header-row">
                      <span className="turns-slot-index" aria-hidden="true" />
                      {turnColumns.map((column) => (
                        <span key={`${period.id}-head-${column}`} className="turns-slot-head" aria-hidden="true">
                          {column}
                        </span>
                      ))}
                    </div>
                    {turnRows.map((row, rowIndex) => (
                      <div key={`${period.id}-row-${row}`} className="turns-slot-row">
                        <span className="turns-slot-index">{row}</span>
                        {turnColumns.map((column, columnIndex) => (
                          <label key={`${period.id}-${row}-${column}`} className="turns-slot">
                            <input
                              type="checkbox"
                              checked={turnMonitor.periods[period.id][rowIndex][columnIndex]}
                              onChange={(event) =>
                                updateTurnPeriod(period.id, rowIndex, columnIndex, event.target.checked)
                              }
                              aria-label={`${period.label} linha ${row} coluna ${column}`}
                            />
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="turns-section">
            <h4>Efeito e duração</h4>
            <div className="turns-table effects">
              <div className="turns-table-row turns-table-header">
                <span>Efeito</span>
                <span>Duração</span>
              </div>
              {turnMonitor.effectRows.map((row, index) => (
                <div key={`effect-${index}`} className="turns-table-row">
                  <input
                    type="text"
                    placeholder="Efeito"
                    value={row.effect}
                    onChange={(event) => updateEffectRow(index, 'effect', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duração"
                    value={row.duration}
                    onChange={(event) => updateEffectRow(index, 'duration', event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="turns-section">
            <h4>Ordem de marcha</h4>
            <textarea
              className="turns-textarea"
              placeholder="Anote a ordem do grupo"
              rows={6}
              value={turnMonitor.orderOfMarch}
              onChange={(event) => setOrderOfMarch(event.target.value)}
            />
          </div>

          <div className="turns-section">
            <h4>Ordem de vigília</h4>
            <textarea
              className="turns-textarea"
              placeholder="Anote as guardas da noite"
              rows={6}
              value={turnMonitor.orderOfWatch}
              onChange={(event) => setOrderOfWatch(event.target.value)}
            />
          </div>
        </div>

        <div className="turns-column">
          <div className="turns-section">
            <h4>Marcando turnos</h4>
            <ol className="turns-list">
              <li>Marque a cada ação do grupo ou 10 min.</li>
              <li>Role encontros no turno indicado.</li>
              <li>Descreva o local.</li>
              <li>Verifique percepção se necessário.</li>
              <li>Resolva ações e marque deslocamento.</li>
            </ol>
          </div>

          <div className="turns-section">
            <h4>Rolagem de encontros</h4>
            <ol className="turns-list">
              <li>Role 1d6. 1 = encontro.</li>
              <li>Se for encontro, role na tabela.</li>
              <li>Role a distância (1d6 x 3m).</li>
              <li>Teste a reação dos adversários.</li>
              <li>Se couber, determine surpresa.</li>
            </ol>
          </div>

          <div className="turns-section">
            <h4>Ações em masmorras</h4>
            <div className="turns-actions">
              {dungeonActions.map((action, index) => (
                <label key={action} className="turns-action">
                  <input
                    type="checkbox"
                    checked={turnMonitor.actions[index]}
                    onChange={(event) => updateTurnAction(index, event.target.checked)}
                  />
                  <span>{action}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="turns-section">
            <h4>Tabela de reações (2d6)</h4>
            <div className="turns-table reactions">
              <div className="turns-table-row turns-table-header">
                <span>2d6</span>
                <span>Reação</span>
              </div>
              {reactionTable.map((row) => (
                <div key={row.roll} className="turns-table-row">
                  <span>{row.roll}</span>
                  <span>{row.result}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="turns-section">
            <h4>Tempo</h4>
            <ul className="turns-meta">
              <li><strong>Rodada:</strong> 10 segundos</li>
              <li><strong>Turno:</strong> 10 minutos</li>
              <li><strong>Minuto:</strong> 6 rodadas</li>
              <li><strong>Hora:</strong> 6 turnos</li>
            </ul>
          </div>

          <div className="turns-section">
            <h4>Durações comuns</h4>
            <ul className="turns-meta">
              <li><strong>Tocha (9m):</strong> 6 turnos (1 hora)</li>
              <li><strong>Lanterna (9m):</strong> 24 turnos (4 horas)</li>
              <li><strong>Vela (1m):</strong> 6 turnos (1 hora)</li>
            </ul>
          </div>

          <div className="turns-section">
            <h4>Controle de PV</h4>
            <div className="turns-table pv">
              <div className="turns-table-row turns-table-header">
                <span>Criatura</span>
                <span></span>
                <span></span>
                <span>CA</span>
                <span>PV máx</span>
                <span>PV atual</span>
              </div>
              {turnMonitor.pvRows.map((row, index) => {
                const selectedMonster = srdMonsters.find((m) => m.name === row.name)
                return (
                  <div key={`pv-${index}`} className="turns-table-row pv-row">
                    <div className="pv-creature-select-wrapper">
                      <select
                        value={row.name}
                        onChange={(event) => {
                          const monsterName = event.target.value
                          updatePvRow(index, 'name', monsterName)
                          const monster = srdMonsters.find((m) => m.name === monsterName)
                          if (monster) {
                            updatePvRow(index, 'max', String(monster.hit_points))
                            updatePvRow(index, 'current', String(monster.hit_points))
                          }
                        }}
                      >
                        <option value="">Selecione...</option>
                        {srdMonsters.map((monster) => (
                          <option key={monster.index} value={monster.name}>
                            {monster.name} (CR {monster.challenge_rating})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="pv-view-stats-btn"
                      onClick={(event) => {
                        if (selectedMonster) {
                          openMonsterStats(selectedMonster, event)
                        }
                      }}
                      disabled={!selectedMonster}
                      title={selectedMonster ? 'Ver estatísticas' : 'Selecione uma criatura'}
                      aria-label="Ver estatísticas da criatura"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                    </button>
                    <button
                      className="pv-add-initiative-btn"
                      onClick={() => {
                        if (!selectedMonster) return
                        const maxHpValue = Number(row.max)
                        const currentHpValue = Number(row.current)
                        const fallbackHp = selectedMonster.hit_points
                        const resolvedMaxHp = Number.isFinite(maxHpValue) && maxHpValue > 0 ? maxHpValue : fallbackHp
                        const resolvedCurrentHp = Number.isFinite(currentHpValue) && currentHpValue >= 0
                          ? Math.min(currentHpValue, resolvedMaxHp)
                          : resolvedMaxHp
                        openAddToInitiative({
                          type: 'monster',
                          name: selectedMonster.name,
                          monsterData: selectedMonster,
                          hp: resolvedCurrentHp,
                          maxHp: resolvedMaxHp,
                          ac: selectedMonster.armor_class[0]?.value
                        })
                      }}
                      disabled={!selectedMonster}
                      title={selectedMonster ? 'Adicionar à iniciativa' : 'Selecione uma criatura'}
                      aria-label="Adicionar criatura à iniciativa"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                        <path d="M13 19l6-6 2 2-6 6-2-2z" />
                        <path d="M19 13l2-2-6-6-2 2" />
                      </svg>
                    </button>
                    <span className="pv-ac-value">
                      {selectedMonster?.armor_class[0]?.value ?? '-'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={row.max}
                      onChange={(event) => updatePvRow(index, 'max', event.target.value)}
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={row.current}
                      onChange={(event) => updatePvRow(index, 'current', event.target.value)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="turns-section">
            <h4>Tabela de monstros errantes</h4>
            <div className="turns-table monsters">
              <div className="turns-table-row turns-table-header">
                <span>Grupo</span>
                <span>Área</span>
                <span>Notas</span>
              </div>
              {turnMonitor.monsterRows.map((row, index) => (
                <div key={`monster-${index}`} className="turns-table-row">
                  <input
                    type="text"
                    placeholder="Grupo"
                    value={row.group}
                    onChange={(event) => updateMonsterRow(index, 'group', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Área"
                    value={row.area}
                    onChange={(event) => updateMonsterRow(index, 'area', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Notas"
                    value={row.notes}
                    onChange={(event) => updateMonsterRow(index, 'notes', event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="turns-column">
          <div className="turns-section">
            <h4>Tabela de encontros (1d10)</h4>
            <div className="turns-encounter-controls">
              <div className="turns-encounter-selects">
                <label className="turns-select">
                  <span>Ambiente</span>
                  <select
                    value={turnMonitor.encounterEnvironment}
                    onChange={(event) =>
                      setTurnMonitor((prev) => ({
                        ...prev,
                        encounterEnvironment: event.target.value
                      }))
                    }
                  >
                    {encounterEnvironments.map((environment) => (
                      <option key={environment.id} value={environment.id}>
                        {environment.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="turns-select">
                  <span>Dificuldade</span>
                  <select
                    value={turnMonitor.encounterDifficulty}
                    onChange={(event) =>
                      setTurnMonitor((prev) => ({
                        ...prev,
                        encounterDifficulty: event.target.value
                      }))
                    }
                  >
                    {encounterDifficulties.map((difficulty) => (
                      <option key={difficulty.id} value={difficulty.id}>
                        {difficulty.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="turns-encounter-buttons">
                <button className="btn-secondary small" onClick={fillEncounterTable}>
                  Preencher 1d10
                </button>
                <button className="btn-secondary small" onClick={fillEncounterTable20}>
                  Preencher 1d20
                </button>
              </div>
            </div>
            <div className="turns-table encounters">
              <div className="turns-table-row turns-table-header">
                <span>1d10</span>
                <span>Encontro</span>
              </div>
              {encounterRolls.map((roll, index) => (
                <div key={roll} className="turns-table-row">
                  <span>{roll}</span>
                  <input
                    type="text"
                    placeholder="Descreva o encontro"
                    value={turnMonitor.encounterTable[index]}
                    onChange={(event) => updateEncounterTable(index, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="turns-section">
            <h4>Tabela de encontros aleatórios (1d20)</h4>
            <div className="turns-table encounters">
              <div className="turns-table-row turns-table-header">
                <span>1d20</span>
                <span>Evento</span>
              </div>
              {encounterRolls20.map((roll, index) => (
                <div key={roll} className="turns-table-row">
                  <span>{roll}</span>
                  <input
                    type="text"
                    placeholder="Descreva o evento"
                    value={turnMonitor.encounterTable20[index]}
                    onChange={(event) => updateEncounterTable20(index, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default TurnsPanel
