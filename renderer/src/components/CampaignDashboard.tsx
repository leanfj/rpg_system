import { useEffect, useMemo, useState } from 'react'
import './CampaignDashboard.css'

interface Campaign {
  id: string
  name: string
  createdAt: Date
}

interface Session {
  id: string
  campaignId: string
  startedAt: Date
  endedAt?: Date
}

interface CampaignDashboardProps {
  campaignId: string
  onStartSession: () => void
}

interface PlayerCharacter {
  id: string
  campaignId: string
  name: string
  playerName?: string
  className: string
  subclass?: string
  level: number
  ancestry: string
  background?: string
  alignment?: string
  experience?: number
  inspiration?: boolean
  proficiencyBonus?: number
  hitPoints: number
  currentHitPoints?: number
  tempHitPoints?: number
  hitDice?: string
  deathSaves?: string
  passivePerception?: number
  armorClass: number
  initiative?: number
  speed?: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  savingThrows?: string
  proficiencies?: string
  skills?: string
  attacks?: string
  spells?: string
  equipment?: string
  features?: string
  personalityTraits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  notes?: string
}

interface NPC {
  id: string
  campaignId: string
  name: string
  race?: string
  occupation?: string
  location?: string
  tags?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface Quest {
  id: string
  campaignId: string
  title: string
  status: string
  objective?: string
  reward?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface MasterNote {
  id: string
  campaignId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

type ProficiencyLevel = 'none' | 'proficient' | 'expertise'

interface ProficiencyEntry {
  key: string
  label: string
  proficiency: ProficiencyLevel
  value: number
}

type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

function CampaignDashboard({ campaignId, onStartSession }: CampaignDashboardProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [players, setPlayers] = useState<PlayerCharacter[]>([])
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [masterNote, setMasterNote] = useState<MasterNote | null>(null)
  const [isMasterNoteOpen, setIsMasterNoteOpen] = useState(false)
  const [masterNoteContent, setMasterNoteContent] = useState('')
  const [isNpcModalOpen, setIsNpcModalOpen] = useState(false)
  const [isNpcReadOnly, setIsNpcReadOnly] = useState(false)
  const [editingNpcId, setEditingNpcId] = useState<string | null>(null)
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false)
  const [isQuestReadOnly, setIsQuestReadOnly] = useState(false)
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null)
  const [isEditingPlayer, setIsEditingPlayer] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [savingThrowEntries, setSavingThrowEntries] = useState<ProficiencyEntry[]>([])
  const [skillEntries, setSkillEntries] = useState<ProficiencyEntry[]>([])
  const [playerForm, setPlayerForm] = useState({
    name: '',
    playerName: '',
    className: '',
    subclass: '',
    level: 1,
    ancestry: '',
    background: '',
    alignment: '',
    experience: 0,
    inspiration: false,
    proficiencyBonus: 2,
    hitPoints: 10,
    currentHitPoints: 10,
    tempHitPoints: 0,
    hitDice: '',
    deathSaves: '',
    passivePerception: 10,
    armorClass: 10,
    initiative: 0,
    speed: 30,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    savingThrows: '',
    proficiencies: '',
    skills: '',
    attacks: '',
    spells: '',
    equipment: '',
    features: '',
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    notes: ''
  })
  const [npcForm, setNpcForm] = useState({
    name: '',
    race: '',
    occupation: '',
    location: '',
    tags: '',
    notes: ''
  })
  const [questForm, setQuestForm] = useState({
    title: '',
    status: 'open',
    objective: '',
    reward: '',
    notes: ''
  })

  const getProficiencyBonusForLevel = (level: number) => {
    const normalizedLevel = Math.max(1, Number(level) || 1)
    const calculated = 2 + Math.floor((normalizedLevel - 1) / 4)
    return Math.min(6, calculated)
  }

  const computedProficiencyBonus = useMemo(
    () => getProficiencyBonusForLevel(playerForm.level),
    [playerForm.level]
  )

  useEffect(() => {
    loadCampaign()
    loadSessions()
    loadPlayers()
    loadNpcs()
    loadQuests()
    loadMasterNote()
  }, [campaignId])

  useEffect(() => {
    setPlayerForm((prev) => {
      if (prev.proficiencyBonus === computedProficiencyBonus) return prev
      return {
        ...prev,
        proficiencyBonus: computedProficiencyBonus
      }
    })
  }, [computedProficiencyBonus])


  const loadCampaign = async () => {
    try {
      const data = await window.electron.campaigns.getAll()
      const current = data.find((item) => item.id === campaignId) || null
      setCampaign(current)
    } catch (error) {
      console.error('Erro ao carregar campanha:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const data = await window.electron.sessions.getByCapaign(campaignId)
      setSessions(data)
    } catch (error) {
      console.error('Erro ao carregar sessoes:', error)
    }
  }

  const loadPlayers = async () => {
    try {
      const data = await window.electron.players.getByCampaign(campaignId)
      setPlayers(data)
    } catch (error) {
      console.error('Erro ao carregar personagens:', error)
    }
  }

  const loadNpcs = async () => {
    try {
      const data = await window.electron.npcs.getByCampaign(campaignId)
      setNpcs(data)
    } catch (error) {
      console.error('Erro ao carregar NPCs:', error)
    }
  }

  const loadQuests = async () => {
    try {
      const data = await window.electron.quests.getByCampaign(campaignId)
      setQuests(data)
    } catch (error) {
      console.error('Erro ao carregar quests:', error)
    }
  }

  const loadMasterNote = async () => {
    try {
      const data = await window.electron.masterNotes.getByCampaign(campaignId)
      setMasterNote(data)
      setMasterNoteContent(data?.content || '')
    } catch (error) {
      console.error('Erro ao carregar anotacoes do mestre:', error)
    }
  }

  const resetPlayerForm = () => {
    setPlayerForm({
      name: '',
      playerName: '',
      className: '',
      subclass: '',
      level: 1,
      ancestry: '',
      background: '',
      alignment: '',
      experience: 0,
      inspiration: false,
      proficiencyBonus: getProficiencyBonusForLevel(1),
      hitPoints: 10,
      currentHitPoints: 10,
      tempHitPoints: 0,
      hitDice: '',
      deathSaves: '',
      passivePerception: 10,
      armorClass: 10,
      initiative: 0,
      speed: 30,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      savingThrows: '',
      proficiencies: '',
      skills: '',
      attacks: '',
      spells: '',
      equipment: '',
      features: '',
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      notes: ''
    })
    setSavingThrowEntries(getDefaultSavingThrows())
    setSkillEntries(getDefaultSkills())
  }

  const resetNpcForm = () => {
    setNpcForm({
      name: '',
      race: '',
      occupation: '',
      location: '',
      tags: '',
      notes: ''
    })
  }

  const resetQuestForm = () => {
    setQuestForm({
      title: '',
      status: 'open',
      objective: '',
      reward: '',
      notes: ''
    })
  }

  const openMasterNote = () => {
    setMasterNoteContent(masterNote?.content || '')
    setIsMasterNoteOpen(true)
  }

  const startCreatePlayer = () => {
    resetPlayerForm()
    setEditingPlayerId(null)
    setIsEditingPlayer(true)
  }

  const startCreateNpc = () => {
    resetNpcForm()
    setEditingNpcId(null)
    setIsNpcReadOnly(false)
    setIsNpcModalOpen(true)
  }

  const startCreateQuest = () => {
    resetQuestForm()
    setEditingQuestId(null)
    setIsQuestReadOnly(false)
    setIsQuestModalOpen(true)
  }

  const startEditPlayer = (player: PlayerCharacter) => {
    setPlayerForm({
      name: player.name,
      playerName: player.playerName || '',
      className: player.className,
      subclass: player.subclass || '',
      level: player.level,
      ancestry: player.ancestry,
      background: player.background || '',
      alignment: player.alignment || '',
      experience: player.experience || 0,
      inspiration: player.inspiration || false,
      proficiencyBonus: getProficiencyBonusForLevel(player.level),
      hitPoints: player.hitPoints,
      currentHitPoints: player.currentHitPoints || player.hitPoints,
      tempHitPoints: player.tempHitPoints || 0,
      hitDice: player.hitDice || '',
      deathSaves: player.deathSaves || '',
      passivePerception: player.passivePerception || 10,
      armorClass: player.armorClass,
      initiative: player.initiative || 0,
      speed: player.speed || 30,
      strength: player.strength,
      dexterity: player.dexterity,
      constitution: player.constitution,
      intelligence: player.intelligence,
      wisdom: player.wisdom,
      charisma: player.charisma,
      savingThrows: player.savingThrows || '',
      proficiencies: player.proficiencies || '',
      skills: player.skills || '',
      attacks: player.attacks || '',
      spells: player.spells || '',
      equipment: player.equipment || '',
      features: player.features || '',
      personalityTraits: player.personalityTraits || '',
      ideals: player.ideals || '',
      bonds: player.bonds || '',
      flaws: player.flaws || '',
      notes: player.notes || ''
    })
    setSavingThrowEntries(parseProficiencyEntries(player.savingThrows, getDefaultSavingThrows()))
    setSkillEntries(parseProficiencyEntries(player.skills, getDefaultSkills()))
    setEditingPlayerId(player.id)
    setIsEditingPlayer(true)
  }

  const startEditNpc = (npc: NPC) => {
    setNpcForm({
      name: npc.name,
      race: npc.race || '',
      occupation: npc.occupation || '',
      location: npc.location || '',
      tags: npc.tags || '',
      notes: npc.notes || ''
    })
    setEditingNpcId(npc.id)
    setIsNpcReadOnly(false)
    setIsNpcModalOpen(true)
  }

  const startEditQuest = (quest: Quest) => {
    setQuestForm({
      title: quest.title,
      status: quest.status,
      objective: quest.objective || '',
      reward: quest.reward || '',
      notes: quest.notes || ''
    })
    setEditingQuestId(quest.id)
    setIsQuestReadOnly(false)
    setIsQuestModalOpen(true)
  }

  const startViewNpc = (npc: NPC) => {
    setNpcForm({
      name: npc.name,
      race: npc.race || '',
      occupation: npc.occupation || '',
      location: npc.location || '',
      tags: npc.tags || '',
      notes: npc.notes || ''
    })
    setEditingNpcId(npc.id)
    setIsNpcReadOnly(true)
    setIsNpcModalOpen(true)
  }

  const startViewQuest = (quest: Quest) => {
    setQuestForm({
      title: quest.title,
      status: quest.status,
      objective: quest.objective || '',
      reward: quest.reward || '',
      notes: quest.notes || ''
    })
    setEditingQuestId(quest.id)
    setIsQuestReadOnly(true)
    setIsQuestModalOpen(true)
  }

  const handleSavePlayer = async () => {
    const payload = {
      ...playerForm,
      level: Number(playerForm.level),
      experience: Number(playerForm.experience) || 0,
      proficiencyBonus: computedProficiencyBonus,
      hitPoints: Number(playerForm.hitPoints),
      currentHitPoints: Number(playerForm.currentHitPoints),
      tempHitPoints: Number(playerForm.tempHitPoints),
      passivePerception: Number(playerForm.passivePerception) || 10,
      armorClass: Number(playerForm.armorClass),
      initiative: Number(playerForm.initiative) || 0,
      speed: Number(playerForm.speed) || 30,
      strength: Number(playerForm.strength),
      dexterity: Number(playerForm.dexterity),
      constitution: Number(playerForm.constitution),
      intelligence: Number(playerForm.intelligence),
      wisdom: Number(playerForm.wisdom),
      charisma: Number(playerForm.charisma),
      alignment: playerForm.alignment || undefined,
      subclass: playerForm.subclass || undefined,
      background: playerForm.background || undefined,
      playerName: playerForm.playerName || undefined,
      hitDice: playerForm.hitDice || undefined,
      deathSaves: playerForm.deathSaves || undefined,
      savingThrows: JSON.stringify(savingThrowEntries),
      proficiencies: playerForm.proficiencies || undefined,
      skills: JSON.stringify(skillEntries),
      attacks: playerForm.attacks || undefined,
      spells: playerForm.spells || undefined,
      equipment: playerForm.equipment || undefined,
      features: playerForm.features || undefined,
      personalityTraits: playerForm.personalityTraits || undefined,
      ideals: playerForm.ideals || undefined,
      bonds: playerForm.bonds || undefined,
      flaws: playerForm.flaws || undefined,
      notes: playerForm.notes || undefined
    }

    try {
      if (editingPlayerId) {
        await window.electron.players.update(editingPlayerId, payload)
      } else {
        await window.electron.players.create({
          campaignId,
          ...payload
        })
      }
      setIsEditingPlayer(false)
      setEditingPlayerId(null)
      resetPlayerForm()
      loadPlayers()
    } catch (error) {
      console.error('Erro ao salvar personagem:', error)
    }
  }

  const handleSaveNpc = async () => {
    const payload = {
      name: npcForm.name,
      race: npcForm.race || undefined,
      occupation: npcForm.occupation || undefined,
      location: npcForm.location || undefined,
      tags: npcForm.tags || undefined,
      notes: npcForm.notes || undefined
    }

    try {
      if (editingNpcId) {
        await window.electron.npcs.update(editingNpcId, payload)
      } else {
        await window.electron.npcs.create({
          campaignId,
          ...payload
        })
      }
      setIsNpcModalOpen(false)
      setEditingNpcId(null)
      setIsNpcReadOnly(false)
      resetNpcForm()
      loadNpcs()
    } catch (error) {
      console.error('Erro ao salvar NPC:', error)
    }
  }

  const handleSaveQuest = async () => {
    const payload = {
      title: questForm.title,
      status: questForm.status,
      objective: questForm.objective || undefined,
      reward: questForm.reward || undefined,
      notes: questForm.notes || undefined
    }

    try {
      if (editingQuestId) {
        await window.electron.quests.update(editingQuestId, payload)
      } else {
        await window.electron.quests.create({
          campaignId,
          ...payload
        })
      }
      setIsQuestModalOpen(false)
      setEditingQuestId(null)
      setIsQuestReadOnly(false)
      resetQuestForm()
      loadQuests()
    } catch (error) {
      console.error('Erro ao salvar quest:', error)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Deseja remover este personagem?')) return
    try {
      await window.electron.players.delete(playerId)
      loadPlayers()
    } catch (error) {
      console.error('Erro ao remover personagem:', error)
    }
  }

  const handleDeleteNpc = async (npcId: string) => {
    if (!confirm('Deseja remover este NPC?')) return
    try {
      await window.electron.npcs.delete(npcId)
      loadNpcs()
    } catch (error) {
      console.error('Erro ao remover NPC:', error)
    }
  }

  const handleDeleteQuest = async (questId: string) => {
    if (!confirm('Deseja remover esta quest?')) return
    try {
      await window.electron.quests.delete(questId)
      loadQuests()
    } catch (error) {
      console.error('Erro ao remover quest:', error)
    }
  }

  const handleSaveMasterNote = async () => {
    try {
      const data = await window.electron.masterNotes.save({
        campaignId,
        content: masterNoteContent
      })
      setMasterNote(data)
      setIsMasterNoteOpen(false)
    } catch (error) {
      console.error('Erro ao salvar anotacoes do mestre:', error)
    }
  }


  const buildPlayerUpdatePayload = (player: PlayerCharacter, overrides?: Partial<PlayerCharacter>) => {
    const data = { ...player, ...overrides }
    return {
      name: data.name,
      playerName: data.playerName || undefined,
      className: data.className,
      subclass: data.subclass || undefined,
      level: Number(data.level),
      ancestry: data.ancestry,
      background: data.background || undefined,
      alignment: data.alignment || undefined,
      experience: Number(data.experience) || 0,
      inspiration: data.inspiration || false,
      proficiencyBonus: getProficiencyBonusForLevel(data.level),
      hitPoints: Number(data.hitPoints),
      currentHitPoints: Number(data.currentHitPoints ?? data.hitPoints),
      tempHitPoints: Number(data.tempHitPoints) || 0,
      hitDice: data.hitDice || undefined,
      deathSaves: data.deathSaves || undefined,
      passivePerception: Number(data.passivePerception) || 10,
      armorClass: Number(data.armorClass),
      initiative: Number(data.initiative) || 0,
      speed: Number(data.speed) || 30,
      strength: Number(data.strength),
      dexterity: Number(data.dexterity),
      constitution: Number(data.constitution),
      intelligence: Number(data.intelligence),
      wisdom: Number(data.wisdom),
      charisma: Number(data.charisma),
      savingThrows: data.savingThrows || undefined,
      proficiencies: data.proficiencies || undefined,
      skills: data.skills || undefined,
      attacks: data.attacks || undefined,
      spells: data.spells || undefined,
      equipment: data.equipment || undefined,
      features: data.features || undefined,
      personalityTraits: data.personalityTraits || undefined,
      ideals: data.ideals || undefined,
      bonds: data.bonds || undefined,
      flaws: data.flaws || undefined,
      notes: data.notes || undefined
    }
  }

  const adjustPlayerHitPoints = async (player: PlayerCharacter, delta: number) => {
    const current = player.currentHitPoints ?? player.hitPoints
    const next = Math.min(player.hitPoints, Math.max(0, current + delta))
    if (next === current) return
    try {
      await window.electron.players.update(player.id, buildPlayerUpdatePayload(player, { currentHitPoints: next }))
      loadPlayers()
    } catch (error) {
      console.error('Erro ao atualizar PV:', error)
    }
  }

  const clearPlayerInspiration = async (player: PlayerCharacter) => {
    if (!player.inspiration) return
    try {
      await window.electron.players.update(player.id, buildPlayerUpdatePayload(player, { inspiration: false }))
      loadPlayers()
    } catch (error) {
      console.error('Erro ao remover inspiracao:', error)
    }
  }

  const getAbilityMod = (score: number) => Math.floor((score - 10) / 2)

  const abilityMod = (key: AbilityKey) => {
    return getAbilityMod(Number(playerForm[key]))
  }

  const formatMod = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  const stats = useMemo(() => {
    const total = sessions.length
    const completed = sessions.filter((session) => session.endedAt).length
    const lastSession = sessions[0]

    const totalMinutes = sessions.reduce((acc, session) => {
      if (!session.endedAt) return acc
      const start = new Date(session.startedAt).getTime()
      const end = new Date(session.endedAt).getTime()
      return acc + Math.max(0, (end - start) / 60000)
    }, 0)

    return {
      total,
      completed,
      totalMinutes: Math.round(totalMinutes),
      lastSessionDate: lastSession?.startedAt ? new Date(lastSession.startedAt) : null
    }
  }, [sessions])

  const getDefaultSavingThrows = (): ProficiencyEntry[] => [
    { key: 'str', label: 'FOR', proficiency: 'none', value: 0 },
    { key: 'dex', label: 'DES', proficiency: 'none', value: 0 },
    { key: 'con', label: 'CON', proficiency: 'none', value: 0 },
    { key: 'int', label: 'INT', proficiency: 'none', value: 0 },
    { key: 'wis', label: 'SAB', proficiency: 'none', value: 0 },
    { key: 'cha', label: 'CAR', proficiency: 'none', value: 0 }
  ]

  const getDefaultSkills = (): ProficiencyEntry[] => [
    { key: 'acrobatics', label: 'Acrobacia', proficiency: 'none', value: 0 },
    { key: 'arcana', label: 'Arcanismo', proficiency: 'none', value: 0 },
    { key: 'athletics', label: 'Atletismo', proficiency: 'none', value: 0 },
    { key: 'performance', label: 'Atuacao', proficiency: 'none', value: 0 },
    { key: 'deception', label: 'Enganacao', proficiency: 'none', value: 0 },
    { key: 'history', label: 'Historia', proficiency: 'none', value: 0 },
    { key: 'intimidation', label: 'Intimidacao', proficiency: 'none', value: 0 },
    { key: 'insight', label: 'Intuicao', proficiency: 'none', value: 0 },
    { key: 'investigation', label: 'Investigacao', proficiency: 'none', value: 0 },
    { key: 'medicine', label: 'Medicina', proficiency: 'none', value: 0 },
    { key: 'nature', label: 'Natureza', proficiency: 'none', value: 0 },
    { key: 'perception', label: 'Percepcao', proficiency: 'none', value: 0 },
    { key: 'persuasion', label: 'Persuasao', proficiency: 'none', value: 0 },
    { key: 'sleight_of_hand', label: 'Prestidigitacao', proficiency: 'none', value: 0 },
    { key: 'religion', label: 'Religiao', proficiency: 'none', value: 0 },
    { key: 'survival', label: 'Sobrevivencia', proficiency: 'none', value: 0 },
    { key: 'stealth', label: 'Furtividade', proficiency: 'none', value: 0 },
    { key: 'animal_handling', label: 'Adestrar animais', proficiency: 'none', value: 0 }
  ]

  const parseProficiencyEntries = (
    raw: string | undefined,
    fallback: ProficiencyEntry[]
  ): ProficiencyEntry[] => {
    if (!raw) return fallback
    try {
      const parsed = JSON.parse(raw) as ProficiencyEntry[]
      if (!Array.isArray(parsed)) return fallback
      return fallback.map((entry) => {
        const found = parsed.find((item) => item.key === entry.key)
        if (!found) return entry
        return {
          ...entry,
          proficiency: found.proficiency || 'none',
          value: Number(found.value) || 0
        }
      })
    } catch {
      return fallback
    }
  }

  const savingThrowAbilityMap: Record<string, AbilityKey> = {
    str: 'strength',
    dex: 'dexterity',
    con: 'constitution',
    int: 'intelligence',
    wis: 'wisdom',
    cha: 'charisma'
  }

  const skillAbilityMap: Record<string, AbilityKey> = {
    acrobatics: 'dexterity',
    arcana: 'intelligence',
    athletics: 'strength',
    performance: 'charisma',
    deception: 'charisma',
    history: 'intelligence',
    intimidation: 'charisma',
    insight: 'wisdom',
    investigation: 'intelligence',
    medicine: 'wisdom',
    nature: 'intelligence',
    perception: 'wisdom',
    persuasion: 'charisma',
    sleight_of_hand: 'dexterity',
    religion: 'intelligence',
    survival: 'wisdom',
    stealth: 'dexterity',
    animal_handling: 'wisdom'
  }

  const calculateEntryValue = (entry: ProficiencyEntry, abilityKey: AbilityKey) => {
    const multiplier = entry.proficiency === 'expertise' ? 2 : entry.proficiency === 'proficient' ? 1 : 0
    return getAbilityMod(Number(playerForm[abilityKey])) + computedProficiencyBonus * multiplier
  }

  const getProficiencyBonusValue = (entry: ProficiencyEntry) => {
    const multiplier = entry.proficiency === 'expertise' ? 2 : entry.proficiency === 'proficient' ? 1 : 0
    return computedProficiencyBonus * multiplier
  }

  useEffect(() => {
    setSavingThrowEntries((prev) =>
      prev.map((entry) => {
        const abilityKey = savingThrowAbilityMap[entry.key]
        return {
          ...entry,
          value: calculateEntryValue(entry, abilityKey)
        }
      })
    )

    setSkillEntries((prev) =>
      prev.map((entry) => {
        const abilityKey = skillAbilityMap[entry.key]
        return {
          ...entry,
          value: calculateEntryValue(entry, abilityKey)
        }
      })
    )
  }, [
    playerForm.strength,
    playerForm.dexterity,
    playerForm.constitution,
    playerForm.intelligence,
    playerForm.wisdom,
    playerForm.charisma,
    computedProficiencyBonus,
    savingThrowEntries.map((entry) => entry.proficiency).join(','),
    skillEntries.map((entry) => entry.proficiency).join(',')
  ])

  const formatDate = (value?: Date | null) => {
    if (!value) return 'Sem sessoes'
    return new Date(value).toLocaleDateString('pt-BR')
  }

  return (
    <div className="campaign-dashboard">
      <section className="dashboard-hero">
        <div className="hero-content">
          <p className="hero-kicker">Campanha ativa</p>
          <h2>{campaign?.name || 'Campanha sem nome'}</h2>
          <p className="hero-subtitle">
            Comece a proxima sessao e acompanhe o progresso da historia.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={onStartSession}>
              Iniciar sessao
            </button>
            <button className="btn-secondary" onClick={loadSessions}>
              Atualizar dados
            </button>
          </div>
        </div>
        <div className="hero-panel">
          <div className="stat-card">
            <span className="stat-label">Sessoes gravadas</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tempo total</span>
            <span className="stat-value">{stats.totalMinutes} min</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Ultima sessao</span>
            <span className="stat-value">{formatDate(stats.lastSessionDate)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Sessoes concluidas</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card timeline">
          <header>
            <h3>Linha do tempo</h3>
            <span className="text-muted">Ultimas sessoes</span>
          </header>
          <div className="timeline-list">
            {sessions.length === 0 ? (
              <div className="dashboard-empty">Nenhuma sessao registrada.</div>
            ) : (
              sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div>
                    <strong>{formatDate(new Date(session.startedAt))}</strong>
                    <p className="text-muted">
                      {session.endedAt ? 'Sessao encerrada' : 'Sessao em andamento'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

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
                      <span>{npc.race || 'Raca desconhecida'}</span>
                      <span>{npc.occupation || 'Ocupacao indefinida'}</span>
                    </div>
                    {tagList.length > 0 && (
                      <div className="npc-tags">
                        {tagList.map((tag) => (
                          <span key={tag} className="npc-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    {npc.notes && <p className="npc-notes">{npc.notes}</p>}
                    <div className="npc-actions">
                      <button
                        className="action-icon-btn"
                        onClick={() => startViewNpc(npc)}
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
                        onClick={() => startEditNpc(npc)}
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
                        onClick={() => handleDeleteNpc(npc.id)}
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
            <button className="npc-add" onClick={startCreateNpc}>
              + Adicionar NPC
            </button>
          </div>

          {isNpcModalOpen && (
            <div className="modal-overlay" onClick={() => setIsNpcModalOpen(false)}>
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h4>{editingNpcId ? (isNpcReadOnly ? 'Detalhes do NPC' : 'Editar NPC') : 'Novo NPC'}</h4>
                  <button className="modal-close" onClick={() => setIsNpcModalOpen(false)}>
                    ✕
                  </button>
                </div>
                <div className="player-form">
                  <div className="player-form-section">
                    <h5>Informacoes basicas</h5>
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
                        <span>Raca</span>
                        <input
                          type="text"
                          value={npcForm.race}
                          readOnly={isNpcReadOnly}
                          onChange={(event) => setNpcForm({ ...npcForm, race: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Ocupacao</span>
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
                        <span>Tags (separadas por virgula)</span>
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
                      <span>Observacoes</span>
                      <textarea
                        value={npcForm.notes}
                        readOnly={isNpcReadOnly}
                        onChange={(event) => setNpcForm({ ...npcForm, notes: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="player-form-actions">
                    <button className="btn-secondary" onClick={() => setIsNpcModalOpen(false)}>
                      {isNpcReadOnly ? 'Fechar' : 'Cancelar'}
                    </button>
                    {!isNpcReadOnly && (
                      <button className="btn-primary" onClick={handleSaveNpc}>
                        {editingNpcId ? 'Salvar' : 'Criar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>

        <article className="dashboard-card players">
          <header>
            <h3>Personagens jogadores</h3>
            
          </header>
          <div className="player-grid">
            {players.length === 0 ? (
              <div className="dashboard-empty">Nenhum personagem cadastrado.</div>
            ) : (
              players.map((player) => {
                const baseHp = player.currentHitPoints ?? player.hitPoints
                const tempHp = player.tempHitPoints ?? 0
                const totalHp = baseHp + tempHp
                return (
                  <div key={player.id} className="player-card">
                    <div className="player-header">
                      <div className="player-title">
                        <strong>{player.name}</strong>
                        {player.inspiration && (
                          <button
                            className="player-inspiration"
                            onClick={() => clearPlayerInspiration(player)}
                            title="Remover inspiracao"
                            aria-label="Remover inspiracao"
                          >
                            Inspiracao
                          </button>
                        )}
                      </div>
                      <div className="player-actions">
                        <div className="player-hp-controls">
                          <span className="player-hp-value">
                            PV {totalHp}/{player.hitPoints}
                            {tempHp > 0 && (
                              <span className="player-hp-temp">(+{tempHp} temp)</span>
                            )}
                          </span>
                          <div className="player-hp-buttons">
                            <button
                              className="player-hp-btn"
                              onClick={() => adjustPlayerHitPoints(player, -1)}
                              aria-label="Reduzir PV"
                              title="Reduzir PV"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M6 12h12" />
                              </svg>
                            </button>
                            <button
                              className="player-hp-btn"
                              onClick={() => adjustPlayerHitPoints(player, 1)}
                              aria-label="Aumentar PV"
                              title="Aumentar PV"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 6v12M6 12h12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  <span className="text-muted">
                    {player.className} {player.subclass ? `(${player.subclass})` : ''} (Nivel {player.level}) - {player.ancestry}
                  </span>
                  <div className="player-stats">
                    <span>CA {player.armorClass}</span>
                    <span>FOR {formatMod(getAbilityMod(player.strength))}</span>
                    <span>DES {formatMod(getAbilityMod(player.dexterity))}</span>
                    <span>CON {formatMod(getAbilityMod(player.constitution))}</span>
                    <span>INT {formatMod(getAbilityMod(player.intelligence))}</span>
                    <span>SAB {formatMod(getAbilityMod(player.wisdom))}</span>
                    <span>CAR {formatMod(getAbilityMod(player.charisma))}</span>
                  </div>
                  <div className="player-footer">
                    <button
                      className="action-icon-btn"
                      onClick={() => startEditPlayer(player)}
                      aria-label="Editar personagem"
                      title="Editar"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                        <path d="M13 7l4 4" />
                      </svg>
                    </button>
                    <button
                      className="action-icon-btn danger"
                      onClick={() => handleDeletePlayer(player.id)}
                      aria-label="Remover personagem"
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
            <button className="player-add" onClick={startCreatePlayer}>
              + Adicionar personagem
            </button>
          </div>

          {isEditingPlayer && (
            <div className="modal-overlay" onClick={() => setIsEditingPlayer(false)}>
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h4>{editingPlayerId ? 'Editar personagem' : 'Novo personagem'}</h4>
                  <button className="modal-close" onClick={() => setIsEditingPlayer(false)}>
                    ✕
                  </button>
                </div>
                <div className="player-form">
                  <div className="player-form-section">
                    <h5>Dados basicos</h5>
                    <div className="player-form-grid">
                      <label className="field">
                        <span>Nome do personagem</span>
                        <input
                          type="text"
                          value={playerForm.name}
                          onChange={(event) => setPlayerForm({ ...playerForm, name: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Nome do jogador</span>
                        <input
                          type="text"
                          value={playerForm.playerName}
                          onChange={(event) => setPlayerForm({ ...playerForm, playerName: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Classe</span>
                        <input
                          type="text"
                          value={playerForm.className}
                          onChange={(event) => setPlayerForm({ ...playerForm, className: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Subclasse</span>
                        <input
                          type="text"
                          value={playerForm.subclass}
                          onChange={(event) => setPlayerForm({ ...playerForm, subclass: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Nivel</span>
                        <input
                          type="number"
                          min={1}
                          value={playerForm.level}
                          onChange={(event) => setPlayerForm({ ...playerForm, level: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Ancestralidade</span>
                        <input
                          type="text"
                          value={playerForm.ancestry}
                          onChange={(event) => setPlayerForm({ ...playerForm, ancestry: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Background</span>
                        <input
                          type="text"
                          value={playerForm.background}
                          onChange={(event) => setPlayerForm({ ...playerForm, background: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Alinhamento</span>
                        <input
                          type="text"
                          value={playerForm.alignment}
                          onChange={(event) => setPlayerForm({ ...playerForm, alignment: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Experiencia</span>
                        <input
                          type="number"
                          min={0}
                          value={playerForm.experience}
                          onChange={(event) => setPlayerForm({ ...playerForm, experience: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="player-form-section">
                    <h5>Combate</h5>
                    <div className="player-form-grid compact">
                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={playerForm.inspiration}
                          onChange={(event) => setPlayerForm({ ...playerForm, inspiration: event.target.checked })}
                        />
                        Inspiracao
                      </label>
                      <label className="field">
                        <span>Bonus de proficiencia</span>
                        <input
                          type="number"
                          min={0}
                          value={computedProficiencyBonus}
                          readOnly
                        />
                      </label>
                      <label className="field">
                        <span>Classe de armadura</span>
                        <input
                          type="number"
                          min={0}
                          value={playerForm.armorClass}
                          onChange={(event) => setPlayerForm({ ...playerForm, armorClass: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Iniciativa</span>
                        <input
                          type="number"
                          value={playerForm.initiative}
                          onChange={(event) => setPlayerForm({ ...playerForm, initiative: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Deslocamento</span>
                        <input
                          type="number"
                          value={playerForm.speed}
                          onChange={(event) => setPlayerForm({ ...playerForm, speed: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Percepcao passiva</span>
                        <input
                          type="number"
                          value={playerForm.passivePerception}
                          onChange={(event) => setPlayerForm({ ...playerForm, passivePerception: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="player-form-section">
                    <h5>Pontos de vida</h5>
                    <div className="player-form-grid compact">
                      <label className="field">
                        <span>PV maximo</span>
                        <input
                          type="number"
                          min={1}
                          value={playerForm.hitPoints}
                          onChange={(event) => setPlayerForm({ ...playerForm, hitPoints: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>PV atual</span>
                        <input
                          type="number"
                          min={0}
                          value={playerForm.currentHitPoints}
                          onChange={(event) => setPlayerForm({ ...playerForm, currentHitPoints: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>PV temporario</span>
                        <input
                          type="number"
                          min={0}
                          value={playerForm.tempHitPoints}
                          onChange={(event) => setPlayerForm({ ...playerForm, tempHitPoints: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Dados de vida</span>
                        <input
                          type="text"
                          value={playerForm.hitDice}
                          onChange={(event) => setPlayerForm({ ...playerForm, hitDice: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Testes contra morte</span>
                        <input
                          type="text"
                          value={playerForm.deathSaves}
                          onChange={(event) => setPlayerForm({ ...playerForm, deathSaves: event.target.value })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="player-form-section">
                    <h5>Atributos</h5>
                    <div className="player-form-grid stats">
                      <label className="field">
                        <span>FOR <span className="badge">{formatMod(abilityMod('strength'))}</span></span>
                        <input
                          type="number"
                          value={playerForm.strength}
                          onChange={(event) => setPlayerForm({ ...playerForm, strength: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>DES <span className="badge">{formatMod(abilityMod('dexterity'))}</span></span>
                        <input
                          type="number"
                          value={playerForm.dexterity}
                          onChange={(event) => setPlayerForm({ ...playerForm, dexterity: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>CON <span className="badge">{formatMod(abilityMod('constitution'))}</span></span>
                        <input
                          type="number"
                          value={playerForm.constitution}
                          onChange={(event) => setPlayerForm({ ...playerForm, constitution: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>INT <span className="badge">{formatMod(abilityMod('intelligence'))}</span></span>
                        <input
                          type="number"
                          value={playerForm.intelligence}
                          onChange={(event) => setPlayerForm({ ...playerForm, intelligence: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>SAB <span className="badge">{formatMod(abilityMod('wisdom'))}</span></span>
                        <input
                          type="number"
                          value={playerForm.wisdom}
                          onChange={(event) => setPlayerForm({ ...playerForm, wisdom: Number(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>CAR <span className="badge">{formatMod(abilityMod('charisma'))}</span></span>
                        <input
                          type="number"
                          value={playerForm.charisma}
                          onChange={(event) => setPlayerForm({ ...playerForm, charisma: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="player-form-section">
                    <h5>Pericias e salvaguardas</h5>
                    <label className="field proficiency-notes">
                      <span>Proficiencias gerais</span>
                      <textarea
                        value={playerForm.proficiencies}
                        onChange={(event) => setPlayerForm({ ...playerForm, proficiencies: event.target.value })}
                      />
                    </label>
                    <div className="proficiency-columns">
                      <div className="proficiency-block">
                        <span className="proficiency-title">Salvaguardas</span>
                        <div className="proficiency-grid">
                          {savingThrowEntries.map((entry) => (
                            <div key={entry.key} className="proficiency-row">
                              <span className="proficiency-label">{entry.label}</span>
                              <select
                                className="proficiency-select"
                                value={entry.proficiency}
                                onChange={(event) =>
                                  setSavingThrowEntries((prev) =>
                                    prev.map((item) =>
                                      item.key === entry.key
                                        ? { ...item, proficiency: event.target.value as ProficiencyLevel }
                                        : item
                                    )
                                  )
                                }
                              >
                                <option value="none">Sem prof.</option>
                                <option value="proficient">Proficiente</option>
                                <option value="expertise">Especialista</option>
                              </select>
                              <input
                                className="proficiency-value"
                                type="text"
                                value={formatMod(getProficiencyBonusValue(entry))}
                                readOnly
                                title="Bonus de proficiencia"
                              />
                              <input
                                className="proficiency-value"
                                type="text"
                                value={formatMod(abilityMod(savingThrowAbilityMap[entry.key]))}
                                readOnly
                                title="Bonus de atributo"
                              />
                              <input
                                className="proficiency-total"
                                type="text"
                                value={formatMod(entry.value)}
                                readOnly
                                title="Total"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="proficiency-block">
                        <span className="proficiency-title">Pericias</span>
                        <div className="proficiency-grid">
                          {skillEntries.map((entry) => (
                            <div key={entry.key} className="proficiency-row">
                              <span className="proficiency-label">{entry.label}</span>
                              <select
                                className="proficiency-select"
                                value={entry.proficiency}
                                onChange={(event) =>
                                  setSkillEntries((prev) =>
                                    prev.map((item) =>
                                      item.key === entry.key
                                        ? { ...item, proficiency: event.target.value as ProficiencyLevel }
                                        : item
                                    )
                                  )
                                }
                              >
                                <option value="none">Sem prof.</option>
                                <option value="proficient">Proficiente</option>
                                <option value="expertise">Especialista</option>
                              </select>
                              <input
                                className="proficiency-value"
                                type="text"
                                value={formatMod(getProficiencyBonusValue(entry))}
                                readOnly
                                title="Bonus de proficiencia"
                              />
                              <input
                                className="proficiency-value"
                                type="text"
                                value={formatMod(abilityMod(skillAbilityMap[entry.key]))}
                                readOnly
                                title="Bonus de atributo"
                              />
                              <input
                                className="proficiency-total"
                                type="text"
                                value={formatMod(entry.value)}
                                readOnly
                                title="Total"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="player-form-section">
                    <h5>Combate e magias</h5>
                    <label className="field">
                      <span>Ataques e conjuracao</span>
                      <textarea
                        value={playerForm.attacks}
                        onChange={(event) => setPlayerForm({ ...playerForm, attacks: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Magias conhecidas</span>
                      <textarea
                        value={playerForm.spells}
                        onChange={(event) => setPlayerForm({ ...playerForm, spells: event.target.value })}
                      />
                    </label>
                  </div>

                  <div className="player-form-section">
                    <h5>Equipamentos e habilidades</h5>
                    <label className="field">
                      <span>Equipamentos</span>
                      <textarea
                        value={playerForm.equipment}
                        onChange={(event) => setPlayerForm({ ...playerForm, equipment: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Caracteristicas e talentos</span>
                      <textarea
                        value={playerForm.features}
                        onChange={(event) => setPlayerForm({ ...playerForm, features: event.target.value })}
                      />
                    </label>
                  </div>

                  <div className="player-form-section">
                    <h5>Personalidade</h5>
                    <label className="field">
                      <span>Tracos de personalidade</span>
                      <textarea
                        value={playerForm.personalityTraits}
                        onChange={(event) => setPlayerForm({ ...playerForm, personalityTraits: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Ideais</span>
                      <textarea
                        value={playerForm.ideals}
                        onChange={(event) => setPlayerForm({ ...playerForm, ideals: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Vinculos</span>
                      <textarea
                        value={playerForm.bonds}
                        onChange={(event) => setPlayerForm({ ...playerForm, bonds: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Defeitos</span>
                      <textarea
                        value={playerForm.flaws}
                        onChange={(event) => setPlayerForm({ ...playerForm, flaws: event.target.value })}
                      />
                    </label>
                  </div>

                  <div className="player-form-section">
                    <h5>Anotacoes gerais</h5>
                    <label className="field">
                      <span>Notas</span>
                      <textarea
                        value={playerForm.notes}
                        onChange={(event) => setPlayerForm({ ...playerForm, notes: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="player-form-actions">
                    <button className="btn-secondary" onClick={() => setIsEditingPlayer(false)}>
                      Cancelar
                    </button>
                    <button className="btn-primary" onClick={handleSavePlayer}>
                      {editingPlayerId ? 'Salvar' : 'Criar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>

        <article className="dashboard-card quests">
          <header>
            <h3>Quest log</h3>
            <span className="text-muted">Status das missoes</span>
          </header>
          <ul className="quest-list">
            {quests.length === 0 ? (
              <li className="dashboard-empty">Nenhuma quest cadastrada.</li>
            ) : (
              quests.map((quest) => {
                const statusLabel =
                  quest.status === 'open'
                    ? 'Em aberto'
                    : quest.status === 'in_progress'
                      ? 'Em andamento'
                      : quest.status === 'done'
                        ? 'Concluida'
                        : quest.status === 'failed'
                          ? 'Falhou'
                          : quest.status
                const statusClass =
                  quest.status === 'open'
                    ? 'open'
                    : quest.status === 'in_progress'
                      ? 'progress'
                      : quest.status === 'done'
                        ? 'done'
                        : quest.status === 'failed'
                          ? 'failed'
                          : 'open'
                return (
                  <li key={quest.id} className="quest-item">
                    <div className="quest-main">
                      <span className={`quest-status ${statusClass}`}>{statusLabel}</span>
                      <strong>{quest.title}</strong>
                    </div>
                    <div className="quest-actions">
                      <button
                        className="quest-icon-btn"
                        onClick={() => startViewQuest(quest)}
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
                        onClick={() => startEditQuest(quest)}
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
                        onClick={() => handleDeleteQuest(quest.id)}
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
          <button className="btn-secondary small" onClick={startCreateQuest}>
            + Adicionar quest
          </button>

          {isQuestModalOpen && (
            <div className="modal-overlay" onClick={() => setIsQuestModalOpen(false)}>
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h4>{editingQuestId ? (isQuestReadOnly ? 'Detalhes da quest' : 'Editar quest') : 'Nova quest'}</h4>
                  <button className="modal-close" onClick={() => setIsQuestModalOpen(false)}>
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
                      <span>Observacoes</span>
                      <textarea
                        value={questForm.notes}
                        readOnly={isQuestReadOnly}
                        onChange={(event) => setQuestForm({ ...questForm, notes: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="player-form-actions">
                    <button className="btn-secondary" onClick={() => setIsQuestModalOpen(false)}>
                      {isQuestReadOnly ? 'Fechar' : 'Cancelar'}
                    </button>
                    {!isQuestReadOnly && (
                      <button className="btn-primary" onClick={handleSaveQuest}>
                        {editingQuestId ? 'Salvar' : 'Criar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>

        <article className="dashboard-card notes">
          <header>
            <h3>Anotacoes do mestre</h3>
          </header>
          <div className="note-box">
            {masterNote?.content ? (
              <pre className="master-note-preview">{masterNote.content}</pre>
            ) : (
              <p className="text-muted">Nenhuma anotacao salva.</p>
            )}
          </div>
          <button className="btn-secondary small" onClick={openMasterNote}>
            {masterNote?.content ? 'Editar anotacoes' : 'Adicionar anotacoes'}
          </button>

          {isMasterNoteOpen && (
            <div className="modal-overlay" onClick={() => setIsMasterNoteOpen(false)}>
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h4>Anotacoes do mestre</h4>
                  <button className="modal-close" onClick={() => setIsMasterNoteOpen(false)}>
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
                    <button className="btn-secondary" onClick={() => setIsMasterNoteOpen(false)}>
                      Cancelar
                    </button>
                    <button className="btn-primary" onClick={handleSaveMasterNote}>
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>

        <article className="dashboard-card next">
          <header>
            <h3>Proxima sessao</h3>
            <span className="text-muted">Checklist rapido</span>
          </header>
          <div className="checklist">
            <label><input type="checkbox" /> Revisar encontros</label>
            <label><input type="checkbox" /> Preparar mapa</label>
            <label><input type="checkbox" /> Atualizar NPCs</label>
            <label><input type="checkbox" /> Separar trilha sonora</label>
          </div>
        </article>
      </section>
    </div>
  )
}

export default CampaignDashboard
