import { useEffect, useMemo, useState } from 'react'

type XpPlayerBase = {
  id: string
  name: string
  experience?: number
}

type XpAward = {
  id: string
  amount: number
}

type XpReportPanelProps<TPlayer extends XpPlayerBase> = {
  players: TPlayer[]
  onApplyXp: (awards: XpAward[]) => Promise<void> | void
}

function XpReportPanel<TPlayer extends XpPlayerBase>({ players, onApplyXp }: XpReportPanelProps<TPlayer>) {
  const [totalXp, setTotalXp] = useState('')
  const [mode, setMode] = useState<'equal' | 'manual'>('equal')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [customAwards, setCustomAwards] = useState<Record<string, string>>({})
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    setSelectedIds((prev) => {
      const playerIds = players.map((player) => player.id)
      if (prev.length === 0) return playerIds
      return prev.filter((id) => playerIds.includes(id))
    })

    setCustomAwards((prev) => {
      const playerIds = new Set(players.map((player) => player.id))
      const next: Record<string, string> = {}
      Object.keys(prev).forEach((key) => {
        if (playerIds.has(key)) next[key] = prev[key]
      })
      return next
    })
  }, [players])

  const selectedPlayers = useMemo(
    () => players.filter((player) => selectedIds.includes(player.id)),
    [players, selectedIds]
  )

  const totalValue = useMemo(() => Math.max(0, Number(totalXp) || 0), [totalXp])
  const splitCount = selectedPlayers.length
  const share = splitCount > 0 ? Math.floor(totalValue / splitCount) : 0
  const remainder = splitCount > 0 ? totalValue % splitCount : 0

  useEffect(() => {
    if (mode !== 'manual') return
    setCustomAwards((prev) => {
      const next = { ...prev }
      selectedPlayers.forEach((player) => {
        if (next[player.id] === undefined) {
          next[player.id] = String(share)
        }
      })
      return next
    })
  }, [mode, selectedPlayers, share])

  const assignedTotal = useMemo(() => {
    if (mode === 'equal') return share * splitCount
    return selectedPlayers.reduce((total, player) => {
      return total + (Number(customAwards[player.id]) || 0)
    }, 0)
  }, [customAwards, mode, selectedPlayers, share, splitCount])

  const togglePlayer = (playerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    )
  }

  const handleCustomAwardChange = (playerId: string, value: string) => {
    setCustomAwards((prev) => ({
      ...prev,
      [playerId]: value
    }))
  }

  const handleApply = async () => {
    if (selectedPlayers.length === 0) return

    const awards = selectedPlayers.map((player) => ({
      id: player.id,
      amount: mode === 'equal' ? share : Math.max(0, Number(customAwards[player.id]) || 0)
    }))

    const appliedTotal = awards.reduce((total, award) => total + award.amount, 0)
    if (appliedTotal <= 0) return

    setIsApplying(true)
    try {
      await onApplyXp(awards)
      setTotalXp('')
      setCustomAwards({})
    } catch (error) {
      console.error('Erro ao aplicar XP:', error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <article className="dashboard-card xp-report">
      <header>
        <div>
          <h3>Relatorio de XP</h3>
          <p className="xp-report-subtitle">Distribua a experiencia da sessao.</p>
        </div>
      </header>

      <div className="xp-report-controls">
        <label className="xp-report-input">
          XP total da sessao
          <input
            type="number"
            min={0}
            value={totalXp}
            onChange={(event) => setTotalXp(event.target.value)}
            placeholder="0"
          />
        </label>

        <div className="xp-report-modes">
          <label className="xp-report-mode">
            <input
              type="radio"
              name="xp-mode"
              checked={mode === 'equal'}
              onChange={() => setMode('equal')}
            />
            Dividir igualmente
          </label>
          <label className="xp-report-mode">
            <input
              type="radio"
              name="xp-mode"
              checked={mode === 'manual'}
              onChange={() => setMode('manual')}
            />
            Distribuir manualmente
          </label>
        </div>
      </div>

      <div className="xp-report-list">
        {players.length === 0 && (
          <div className="xp-report-empty">Nenhum personagem cadastrado.</div>
        )}
        {players.map((player) => {
          const isSelected = selectedIds.includes(player.id)
          const currentXp = player.experience || 0
          return (
            <div key={player.id} className={`xp-report-row ${isSelected ? '' : 'is-muted'}`}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => togglePlayer(player.id)}
                aria-label={`Selecionar ${player.name}`}
              />
              <div className="xp-report-player">
                <span>{player.name}</span>
                <span className="xp-report-meta">Atual: {currentXp}</span>
              </div>
              {mode === 'manual' ? (
                <input
                  type="number"
                  min={0}
                  value={customAwards[player.id] ?? ''}
                  onChange={(event) => handleCustomAwardChange(player.id, event.target.value)}
                  disabled={!isSelected}
                  placeholder="0"
                />
              ) : (
                <span className="xp-report-share">+{isSelected ? share : 0}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="xp-report-summary">
        <div className="xp-report-summary-details">
          <span>Selecionados: {splitCount}</span>
          <span>XP aplicado: {assignedTotal}</span>
          {mode === 'equal' && remainder > 0 && <span>Sobra: {remainder}</span>}
        </div>
        <button className="btn-primary" onClick={handleApply} disabled={isApplying || splitCount === 0}>
          {isApplying ? 'Aplicando...' : 'Aplicar XP'}
        </button>
      </div>
    </article>
  )
}

export default XpReportPanel
