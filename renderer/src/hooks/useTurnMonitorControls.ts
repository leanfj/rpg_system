import { type Dispatch, type SetStateAction } from 'react'

type DifficultyOption<TDifficulty extends string> = {
  id: TDifficulty
  label: string
}

type UseTurnMonitorControlsOptions<
  TTurnPeriodId extends string,
  TEnvironment extends string,
  TDifficulty extends string,
  TPvRow extends Record<string, string>,
  TMonsterRow extends Record<string, string>,
  TEffectRow extends Record<string, string>,
  TTurnMonitor extends {
    periods: Record<TTurnPeriodId, boolean[][]>
    orderOfMarch: string
    orderOfWatch: string
    actions: boolean[]
    encounterTable: string[]
    encounterTable20: string[]
    encounterEnvironment: TEnvironment
    encounterDifficulty: TDifficulty
    pvRows: TPvRow[]
    monsterRows: TMonsterRow[]
    effectRows: TEffectRow[]
  }
> = {
  turnMonitor: TTurnMonitor
  setTurnMonitor: Dispatch<SetStateAction<TTurnMonitor>>
  encounterRolls: string[]
  encounterRolls20: string[]
  encounterTables: Record<TEnvironment, Record<TDifficulty, string[]>>
  encounterTables20: Record<TEnvironment, string[]>
  encounterDifficulties: Array<DifficultyOption<TDifficulty>>
  fallbackDifficultyId: TDifficulty
}

export const useTurnMonitorControls = <
  TTurnPeriodId extends string,
  TEnvironment extends string,
  TDifficulty extends string,
  TPvRow extends Record<string, string>,
  TMonsterRow extends Record<string, string>,
  TEffectRow extends Record<string, string>,
  TTurnMonitor extends {
    periods: Record<TTurnPeriodId, boolean[][]>
    orderOfMarch: string
    orderOfWatch: string
    actions: boolean[]
    encounterTable: string[]
    encounterTable20: string[]
    encounterEnvironment: TEnvironment
    encounterDifficulty: TDifficulty
    pvRows: TPvRow[]
    monsterRows: TMonsterRow[]
    effectRows: TEffectRow[]
  }
>({
  turnMonitor,
  setTurnMonitor,
  encounterRolls,
  encounterRolls20,
  encounterTables,
  encounterTables20,
  encounterDifficulties,
  fallbackDifficultyId
}: UseTurnMonitorControlsOptions<
  TTurnPeriodId,
  TEnvironment,
  TDifficulty,
  TPvRow,
  TMonsterRow,
  TEffectRow,
  TTurnMonitor
>) => {
  const updateTurnPeriod = (
    periodId: TTurnPeriodId,
    rowIndex: number,
    columnIndex: number,
    value: boolean
  ) => {
    setTurnMonitor((prev) => ({
      ...prev,
      periods: {
        ...prev.periods,
        [periodId]: prev.periods[periodId].map((row, currentRowIndex) =>
          currentRowIndex === rowIndex
            ? row.map((slot, currentColumnIndex) => (currentColumnIndex === columnIndex ? value : slot))
            : row
        )
      }
    }))
  }

  const updateTurnAction = (index: number, value: boolean) => {
    setTurnMonitor((prev) => ({
      ...prev,
      actions: prev.actions.map((action, actionIndex) =>
        actionIndex === index ? value : action
      )
    }))
  }

  const updateEncounterTable = (index: number, value: string) => {
    setTurnMonitor((prev) => ({
      ...prev,
      encounterTable: prev.encounterTable.map((entry, entryIndex) =>
        entryIndex === index ? value : entry
      )
    }))
  }

  const updateEncounterTable20 = (index: number, value: string) => {
    setTurnMonitor((prev) => ({
      ...prev,
      encounterTable20: prev.encounterTable20.map((entry, entryIndex) =>
        entryIndex === index ? value : entry
      )
    }))
  }

  const getDifficultyLabel = (difficulty: TDifficulty) => {
    return encounterDifficulties.find((item) => item.id === difficulty)?.label || 'Médio'
  }

  const fillEncounterTable = () => {
    setTurnMonitor((prev) => {
      const environment = prev.encounterEnvironment
      const difficulty = prev.encounterDifficulty
      const fallback = encounterTables[environment]?.[fallbackDifficultyId]
      const table =
        encounterTables[environment]?.[difficulty] ||
        fallback ||
        []
      const normalizedTable = Array.from({ length: encounterRolls.length }, (_, index) =>
        table[index] ?? ''
      )
      return { ...prev, encounterTable: normalizedTable }
    })
  }

  const fillEncounterTable20 = () => {
    setTurnMonitor((prev) => {
      const environment = prev.encounterEnvironment
      const difficulty = prev.encounterDifficulty
      const template = encounterTables20[environment] || []
      const difficultyLabel = getDifficultyLabel(difficulty)
      const normalizedTable = Array.from({ length: encounterRolls20.length }, (_, index) =>
        (template[index] || '')
          .replace('{difficulty}', difficultyLabel)
          .replace('{environment}', environment)
      )
      return { ...prev, encounterTable20: normalizedTable }
    })
  }

  const updatePvRow = (index: number, key: keyof TPvRow, value: string) => {
    setTurnMonitor((prev) => {
      const nextRows = [...prev.pvRows]
      nextRows[index] = { ...nextRows[index], [key]: value }
      return { ...prev, pvRows: nextRows }
    })
  }

  const updateMonsterRow = (index: number, key: keyof TMonsterRow, value: string) => {
    setTurnMonitor((prev) => {
      const nextRows = [...prev.monsterRows]
      nextRows[index] = { ...nextRows[index], [key]: value }
      return { ...prev, monsterRows: nextRows }
    })
  }

  const updateEffectRow = (index: number, key: keyof TEffectRow, value: string) => {
    setTurnMonitor((prev) => {
      const nextRows = [...prev.effectRows]
      nextRows[index] = { ...nextRows[index], [key]: value }
      return { ...prev, effectRows: nextRows }
    })
  }

  const setOrderOfMarch = (value: string) => {
    setTurnMonitor((prev) => ({ ...prev, orderOfMarch: value }))
  }

  const setOrderOfWatch = (value: string) => {
    setTurnMonitor((prev) => ({ ...prev, orderOfWatch: value }))
  }

  return {
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
    setOrderOfWatch
  }
}
