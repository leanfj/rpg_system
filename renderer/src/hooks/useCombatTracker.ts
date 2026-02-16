import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'

type MusicTrack = {
  id: string
  name: string
  path: string
}

export type InitiativeEntry<TMonster = unknown> = {
  id: string
  name: string
  type: 'player' | 'monster'
  initiative: number
  condition?: string
  hp?: number
  maxHp?: number
  ac?: number
  sourceId?: string
  monsterData?: TMonster
  side?: 'ally' | 'enemy'
}

export type SavedEncounter<TMonster = unknown> = {
  id: string
  name: string
  entries: InitiativeEntry<TMonster>[]
}

export type InitiativeTargetEntry<TMonster> = {
  type: 'player' | 'monster'
  name: string
  sourceId?: string
  monsterData?: TMonster
  hp?: number
  maxHp?: number
  ac?: number
}

type CustomInitiativeForm = {
  name: string
  initiative: string
  hp: string
  ac: string
  side: 'ally' | 'enemy'
}

type TurnMonitorLike<TMonster> = {
  encounters: SavedEncounter<TMonster>[]
  music: {
    categories: Record<string, MusicTrack[]>
    activeCategoryId: string
    activeTrackId: string | null
    isPlaying: boolean
  }
}

type UseCombatTrackerOptions<TMonster, TTurnMonitor extends TurnMonitorLike<TMonster>> = {
  turnMonitor: TTurnMonitor
  setTurnMonitor: Dispatch<SetStateAction<TTurnMonitor>>
  onInitiativeStart?: () => void
}

export const useCombatTracker = <TMonster, TTurnMonitor extends TurnMonitorLike<TMonster>>({
  turnMonitor,
  setTurnMonitor,
  onInitiativeStart
}: UseCombatTrackerOptions<TMonster, TTurnMonitor>) => {
  const [initiativeList, setInitiativeList] = useState<InitiativeEntry<TMonster>[]>([])
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)
  const [isAddingToInitiative, setIsAddingToInitiative] = useState(false)
  const [initiativeInputValue, setInitiativeInputValue] = useState('')
  const [initiativeTargetEntry, setInitiativeTargetEntry] = useState<InitiativeTargetEntry<TMonster> | null>(null)
  const nextInitiativeId = useRef(1)
  const lastInitiativeCountRef = useRef(0)
  const [isHpAdjustOpen, setIsHpAdjustOpen] = useState(false)
  const [hpAdjustValue, setHpAdjustValue] = useState('')
  const [hpAdjustTarget, setHpAdjustTarget] = useState<{
    id: string
    name: string
    mode: 'add' | 'sub'
  } | null>(null)
  const [selectedEncounterId, setSelectedEncounterId] = useState('')
  const [isEncounterSaveOpen, setIsEncounterSaveOpen] = useState(false)
  const [encounterNameInput, setEncounterNameInput] = useState('')
  const [encounterSaveMode, setEncounterSaveMode] = useState<'create' | 'update'>('create')
  const [isCustomInitiativeOpen, setIsCustomInitiativeOpen] = useState(false)
  const [customInitiativeForm, setCustomInitiativeForm] = useState<CustomInitiativeForm>({
    name: '',
    initiative: '',
    hp: '',
    ac: '',
    side: 'enemy'
  })

  useEffect(() => {
    if (lastInitiativeCountRef.current === 0 && initiativeList.length > 0) {
      onInitiativeStart?.()
    }
    lastInitiativeCountRef.current = initiativeList.length
  }, [initiativeList.length, onInitiativeStart])

  const selectedEncounter = useMemo(
    () => turnMonitor.encounters.find((encounter) => encounter.id === selectedEncounterId) || null,
    [selectedEncounterId, turnMonitor.encounters]
  )

  const openAddToInitiative = (entry: InitiativeTargetEntry<TMonster>) => {
    setInitiativeTargetEntry(entry)
    setInitiativeInputValue('')
    setIsAddingToInitiative(true)
  }

  const addToInitiative = () => {
    if (!initiativeTargetEntry) return
    const initiativeValue = parseInt(initiativeInputValue, 10)
    if (isNaN(initiativeValue)) return

    const newEntry: InitiativeEntry<TMonster> = {
      id: `initiative-${nextInitiativeId.current++}`,
      name: initiativeTargetEntry.name,
      type: initiativeTargetEntry.type,
      initiative: initiativeValue,
      condition: '',
      hp: initiativeTargetEntry.hp,
      maxHp: initiativeTargetEntry.maxHp,
      ac: initiativeTargetEntry.ac,
      sourceId: initiativeTargetEntry.sourceId,
      monsterData: initiativeTargetEntry.monsterData
    }

    setInitiativeList((prev) => {
      const updated = [...prev, newEntry]
      return updated.sort((a, b) => b.initiative - a.initiative)
    })

    setIsAddingToInitiative(false)
    setInitiativeTargetEntry(null)
    setInitiativeInputValue('')
  }

  const openCustomInitiative = () => {
    setCustomInitiativeForm({
      name: '',
      initiative: '',
      hp: '',
      ac: '',
      side: 'enemy'
    })
    setIsCustomInitiativeOpen(true)
  }

  const addCustomInitiative = () => {
    const name = customInitiativeForm.name.trim()
    const initiativeValue = parseInt(customInitiativeForm.initiative, 10)
    const hpValue = parseInt(customInitiativeForm.hp, 10)
    const acValue = parseInt(customInitiativeForm.ac, 10)

    if (!name || isNaN(initiativeValue) || isNaN(hpValue) || isNaN(acValue)) return

    const newEntry: InitiativeEntry<TMonster> = {
      id: `initiative-${nextInitiativeId.current++}`,
      name,
      type: customInitiativeForm.side === 'ally' ? 'player' : 'monster',
      initiative: initiativeValue,
      condition: '',
      hp: hpValue,
      maxHp: hpValue,
      ac: acValue,
      side: customInitiativeForm.side
    }

    setInitiativeList((prev) => {
      const updated = [...prev, newEntry]
      return updated.sort((a, b) => b.initiative - a.initiative)
    })

    setIsCustomInitiativeOpen(false)
  }

  const removeFromInitiative = (entryId: string) => {
    setInitiativeList((prev) => {
      const removedIndex = prev.findIndex((e) => e.id === entryId)
      const newList = prev.filter((e) => e.id !== entryId)

      if (currentTurnIndex >= newList.length && newList.length > 0) {
        setCurrentTurnIndex(0)
      } else if (removedIndex < currentTurnIndex) {
        setCurrentTurnIndex((prevIndex) => Math.max(0, prevIndex - 1))
      }

      return newList
    })
  }

  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const getDuplicateName = (baseName: string, existing: InitiativeEntry<TMonster>[]) => {
    const normalizedBase = baseName.replace(/\s*\(\d+\)\s*$/, '')
    const pattern = new RegExp(`^${escapeRegex(normalizedBase)}\\s*(?:\\((\\d+)\\))?$`)
    let maxIndex = 1
    let hasMatch = false

    existing.forEach((entry) => {
      const match = entry.name.match(pattern)
      if (!match) return
      hasMatch = true
      if (!match[1]) return
      const parsed = Number(match[1])
      if (Number.isFinite(parsed)) {
        maxIndex = Math.max(maxIndex, parsed)
      }
    })

    const nextIndex = hasMatch ? Math.max(2, maxIndex + 1) : 2
    return `${normalizedBase} (${nextIndex})`
  }

  const duplicateInitiativeEntry = (entry: InitiativeEntry<TMonster>) => {
    setInitiativeList((prev) => {
      const currentId = prev[currentTurnIndex]?.id
      const resolvedHp = entry.maxHp ?? entry.hp
      const newEntry: InitiativeEntry<TMonster> = {
        ...entry,
        id: `initiative-${nextInitiativeId.current++}`,
        name: getDuplicateName(entry.name, prev),
        hp: resolvedHp,
        condition: ''
      }
      const updated = [...prev, newEntry].sort((a, b) => b.initiative - a.initiative)
      if (currentId) {
        const nextIndex = updated.findIndex((item) => item.id === currentId)
        if (nextIndex >= 0) setCurrentTurnIndex(nextIndex)
      }
      return updated
    })
  }

  const isEntryDead = (entry: InitiativeEntry<TMonster>) => entry.hp !== undefined && entry.hp <= 0

  const getNextAliveIndex = (startIndex: number) => {
    if (initiativeList.length === 0) return startIndex
    for (let offset = 1; offset <= initiativeList.length; offset += 1) {
      const nextIndex = (startIndex + offset) % initiativeList.length
      if (!isEntryDead(initiativeList[nextIndex])) return nextIndex
    }
    return startIndex
  }

  const nextTurn = () => {
    if (initiativeList.length === 0) return
    setCurrentTurnIndex((prev) => getNextAliveIndex(prev))
  }

  const previousTurn = () => {
    if (initiativeList.length === 0) return
    setCurrentTurnIndex((prev) => (prev - 1 + initiativeList.length) % initiativeList.length)
  }

  const resetCombat = () => {
    if (!confirm('Deseja encerrar o combate e limpar a lista de iniciativa?')) return
    setInitiativeList([])
    setCurrentTurnIndex(0)
    setTurnMonitor((prev) => {
      const travelTracks = prev.music.categories.viagem
      const nextTrack = travelTracks[0]
      return {
        ...prev,
        music: {
          ...prev.music,
          activeCategoryId: 'viagem',
          activeTrackId: nextTrack ? nextTrack.id : null,
          isPlaying: Boolean(nextTrack)
        }
      }
    })
  }

  const updateInitiativeHp = (entryId: string, delta: number) => {
    setInitiativeList((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId || entry.hp === undefined || entry.maxHp === undefined) return entry
        const newHp = Math.min(entry.maxHp, Math.max(0, entry.hp + delta))
        return { ...entry, hp: newHp }
      })
    )
  }

  const updateInitiativeValue = (entryId: string, value: number) => {
    if (!Number.isFinite(value)) return
    setInitiativeList((prev) => {
      const currentId = prev[currentTurnIndex]?.id
      const updated = prev.map((entry) =>
        entry.id === entryId ? { ...entry, initiative: value } : entry
      )
      const sorted = [...updated].sort((a, b) => b.initiative - a.initiative)
      if (currentId) {
        const nextIndex = sorted.findIndex((entry) => entry.id === currentId)
        if (nextIndex >= 0) setCurrentTurnIndex(nextIndex)
      }
      return sorted
    })
  }

  const updateInitiativeCondition = (entryId: string, condition: string) => {
    setInitiativeList((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, condition } : entry))
    )
  }

  const openHpAdjust = (entry: InitiativeEntry<TMonster>, mode: 'add' | 'sub') => {
    setHpAdjustTarget({ id: entry.id, name: entry.name, mode })
    setHpAdjustValue('')
    setIsHpAdjustOpen(true)
  }

  const applyHpAdjust = () => {
    if (!hpAdjustTarget) return
    const value = parseInt(hpAdjustValue, 10)
    if (isNaN(value) || value <= 0) return
    const delta = hpAdjustTarget.mode === 'sub' ? -value : value
    updateInitiativeHp(hpAdjustTarget.id, delta)
    setIsHpAdjustOpen(false)
    setHpAdjustTarget(null)
    setHpAdjustValue('')
  }

  const openCreateEncounter = () => {
    setEncounterSaveMode('create')
    setEncounterNameInput('')
    setIsEncounterSaveOpen(true)
  }

  const openUpdateEncounter = () => {
    if (!selectedEncounter) return
    setEncounterSaveMode('update')
    setEncounterNameInput(selectedEncounter.name)
    setIsEncounterSaveOpen(true)
  }

  const saveEncounter = () => {
    const name = encounterNameInput.trim()
    if (!name || initiativeList.length === 0) return
    if (encounterSaveMode === 'create') {
      const id = `encounter-${Date.now()}`
      const entries = initiativeList.map((entry) => ({ ...entry }))
      setTurnMonitor((prev) => ({
        ...prev,
        encounters: [...prev.encounters, { id, name, entries }]
      }))
      setSelectedEncounterId(id)
    } else if (selectedEncounter) {
      const entries = initiativeList.map((entry) => ({ ...entry }))
      setTurnMonitor((prev) => ({
        ...prev,
        encounters: prev.encounters.map((encounter) =>
          encounter.id === selectedEncounter.id ? { ...encounter, name, entries } : encounter
        )
      }))
    }
    setIsEncounterSaveOpen(false)
    setEncounterNameInput('')
  }

  const loadEncounter = () => {
    if (!selectedEncounter) return
    setInitiativeList(selectedEncounter.entries.map((entry) => ({ ...entry })))
    setCurrentTurnIndex(0)
  }

  const removeEncounter = () => {
    if (!selectedEncounter) return
    if (!confirm(`Deseja remover o encontro "${selectedEncounter.name}"?`)) return
    setTurnMonitor((prev) => ({
      ...prev,
      encounters: prev.encounters.filter((encounter) => encounter.id !== selectedEncounter.id)
    }))
    setSelectedEncounterId('')
  }

  return {
    initiativeList,
    currentTurnIndex,
    isAddingToInitiative,
    initiativeInputValue,
    initiativeTargetEntry,
    isHpAdjustOpen,
    hpAdjustValue,
    hpAdjustTarget,
    selectedEncounterId,
    selectedEncounter,
    isEncounterSaveOpen,
    encounterNameInput,
    encounterSaveMode,
    isCustomInitiativeOpen,
    customInitiativeForm,
    setIsAddingToInitiative,
    setInitiativeInputValue,
    setIsHpAdjustOpen,
    setHpAdjustValue,
    setSelectedEncounterId,
    setIsEncounterSaveOpen,
    setEncounterNameInput,
    setIsCustomInitiativeOpen,
    setCustomInitiativeForm,
    openAddToInitiative,
    addToInitiative,
    openCustomInitiative,
    addCustomInitiative,
    removeFromInitiative,
    duplicateInitiativeEntry,
    isEntryDead,
    nextTurn,
    previousTurn,
    resetCombat,
    updateInitiativeHp,
    updateInitiativeValue,
    updateInitiativeCondition,
    openHpAdjust,
    applyHpAdjust,
    openCreateEncounter,
    openUpdateEncounter,
    saveEncounter,
    loadEncounter,
    removeEncounter
  }
}
