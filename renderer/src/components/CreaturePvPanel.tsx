import type { InitiativeTargetEntry } from '../hooks/useCombatTracker'

type PvRow = {
  name: string
  max: string
  current: string
}

type MonsterBase = {
  index: string
  name: string
  challenge_rating: number | string
  hit_points: number
  armor_class: Array<{ value: number }>
}

type TurnMonitorBase = {
  pvRows: PvRow[]
}

type CreaturePvPanelProps<TMonitor extends TurnMonitorBase, TMonster extends MonsterBase> = {
  turnMonitor: TMonitor
  srdMonsters: TMonster[]
  updatePvRow: (index: number, key: keyof PvRow, value: string) => void
  openMonsterStats: (monster: TMonster, event?: { clientX: number; clientY: number }) => void
  openAddToInitiative: (entry: InitiativeTargetEntry<TMonster>) => void
}

function CreaturePvPanel<TMonitor extends TurnMonitorBase, TMonster extends MonsterBase>({
  turnMonitor,
  srdMonsters,
  updatePvRow,
  openMonsterStats,
  openAddToInitiative
}: CreaturePvPanelProps<TMonitor, TMonster>) {
  return (
    <article className="dashboard-card creature-pv">
      <header>
        <h3>Controle de PV de criaturas</h3>
      </header>

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
          const selectedMonster = srdMonsters.find((monster) => monster.name === row.name)

          return (
            <div key={`pv-${index}`} className="turns-table-row pv-row">
              <div className="pv-creature-select-wrapper">
                <select
                  value={row.name}
                  onChange={(event) => {
                    const monsterName = event.target.value
                    updatePvRow(index, 'name', monsterName)
                    const monster = srdMonsters.find((item) => item.name === monsterName)
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

              <span className="pv-ac-value">{selectedMonster?.armor_class[0]?.value ?? '-'}</span>

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
    </article>
  )
}

export default CreaturePvPanel
