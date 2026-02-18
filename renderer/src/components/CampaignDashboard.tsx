import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useCombatTracker, InitiativeEntry } from '../hooks/useCombatTracker'
import { useMusicController } from '../hooks/useMusicController'
import { useCampaignData } from '../hooks/useCampaignData'
import { useTurnMonitorControls } from '../hooks/useTurnMonitorControls'
import CombatModals from './CombatModals'
import CombatTrackerPanel from './CombatTrackerPanel'
import DiceRollerPanel from './DiceRollerPanel'
import HeroPanel from './HeroPanel'
import MasterNotesPanel from './MasterNotesPanel'
import MusicPanel from './MusicPanel'
import NpcPanel from './NpcPanel'
import NextSessionChecklist from './NextSessionChecklist'
import PinnedMonsterWindows from './PinnedMonsterWindows'
import PlayerPanel from './PlayerPanel'
import QuestPanel from './QuestPanel'
import SessionNotesPanel from './SessionNotesPanel'
import TimelinePanel from './TimelinePanel'
import TurnsPanel from './TurnsPanel'
import XpReportPanel from './XpReportPanel'
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
  sheetUrl?: string
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

interface Location {
  id: string
  campaignId: string
  name: string
  description?: string
  status: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface StoryEvent {
  id: string
  campaignId: string
  title: string
  description?: string
  status: string
  impact?: string
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

interface SRDMonsterAction {
  name: string
  desc: string
  attack_bonus?: number
  damage?: Array<{
    damage_type: { name: string }
    damage_dice: string
  }>
}

interface SRDMonster {
  index: string
  name: string
  size: string
  type: string
  alignment: string
  armor_class: Array<{ type: string; value: number }>
  hit_points: number
  hit_dice: string
  hit_points_roll: string
  speed: Record<string, string>
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  proficiencies: Array<{
    value: number
    proficiency: { name: string }
  }>
  damage_vulnerabilities: string[]
  damage_resistances: string[]
  damage_immunities: string[]
  condition_immunities: Array<{ name: string }>
  senses: Record<string, string | number>
  languages: string
  challenge_rating: number
  proficiency_bonus: number
  xp: number
  special_abilities?: Array<{ name: string; desc: string }>
  actions?: SRDMonsterAction[]
  reactions?: Array<{ name: string; desc: string }>
  legendary_actions?: Array<{ name: string; desc: string }>
  image?: string
  url?: string
}

// Traduções para termos de D&D 5e
const sizeTranslations: Record<string, string> = {
  'Tiny': 'Miúdo',
  'Small': 'Pequeno',
  'Medium': 'Médio',
  'Large': 'Grande',
  'Huge': 'Enorme',
  'Gargantuan': 'Colossal'
}

const typeTranslations: Record<string, string> = {
  'aberration': 'aberração',
  'beast': 'besta',
  'celestial': 'celestial',
  'construct': 'constructo',
  'dragon': 'dragão',
  'elemental': 'elemental',
  'fey': 'fada',
  'fiend': 'corruptor',
  'giant': 'gigante',
  'humanoid': 'humanoide',
  'monstrosity': 'monstruosidade',
  'ooze': 'gosma',
  'plant': 'planta',
  'undead': 'morto-vivo',
  'swarm of Tiny beasts': 'enxame de bestas Miúdas'
}

const alignmentTranslations: Record<string, string> = {
  'lawful good': 'leal e bom',
  'lawful neutral': 'leal e neutro',
  'lawful evil': 'leal e mau',
  'neutral good': 'neutro e bom',
  'neutral': 'neutro',
  'true neutral': 'neutro',
  'neutral evil': 'neutro e mau',
  'chaotic good': 'caótico e bom',
  'chaotic neutral': 'caótico e neutro',
  'chaotic evil': 'caótico e mau',
  'unaligned': 'sem alinhamento',
  'any alignment': 'qualquer alinhamento',
  'any non-good alignment': 'qualquer alinhamento não bom',
  'any non-lawful alignment': 'qualquer alinhamento não leal',
  'any evil alignment': 'qualquer alinhamento mau',
  'any chaotic alignment': 'qualquer alinhamento caótico'
}

const damageTypeTranslations: Record<string, string> = {
  'acid': 'ácido',
  'bludgeoning': 'concussão',
  'cold': 'frio',
  'fire': 'fogo',
  'force': 'energia',
  'lightning': 'elétrico',
  'necrotic': 'necrótico',
  'piercing': 'perfurante',
  'poison': 'veneno',
  'psychic': 'psíquico',
  'radiant': 'radiante',
  'slashing': 'cortante',
  'thunder': 'trovão'
}

const speedTranslations: Record<string, string> = {
  'walk': 'caminhada',
  'fly': 'voo',
  'swim': 'natação',
  'climb': 'escalada',
  'burrow': 'escavação',
  'hover': 'pairar'
}

const senseTranslations: Record<string, string> = {
  'darkvision': 'visão no escuro',
  'blindsight': 'visão às cegas',
  'truesight': 'visão verdadeira',
  'tremorsense': 'sentido sísmico',
  'passive_perception': 'percepção passiva'
}

// Traduções de nomes de habilidades especiais
const abilityNameTranslations: Record<string, string> = {
  'Amphibious': 'Anfíbio',
  'Keen Smell': 'Faro Aguçado',
  'Keen Sight': 'Visão Aguçada',
  'Keen Hearing': 'Audição Aguçada',
  'Keen Hearing and Smell': 'Audição e Faro Aguçados',
  'Keen Senses': 'Sentidos Aguçados',
  'Pack Tactics': 'Táticas de Bando',
  'Pounce': 'Bote',
  'Charge': 'Investida',
  'Rampage': 'Fúria',
  'Relentless': 'Implacável',
  'Brave': 'Corajoso',
  'Brute': 'Bruto',
  'Cunning Action': 'Ação Ardilosa',
  'Dark Devotion': 'Devoção Sombria',
  'Fey Ancestry': 'Ancestral Feérico',
  'Innate Spellcasting': 'Conjuração Inata',
  'Spellcasting': 'Conjuração',
  'Magic Resistance': 'Resistência à Magia',
  'Magic Weapons': 'Armas Mágicas',
  'Regeneration': 'Regeneração',
  'Spider Climb': 'Escalar Aranha',
  'Web Sense': 'Sentir Teias',
  'Web Walker': 'Andar em Teias',
  'Sunlight Sensitivity': 'Sensibilidade à Luz Solar',
  'Shadow Stealth': 'Furtividade nas Sombras',
  'Shapechanger': 'Metamorfo',
  'Legendary Resistance': 'Resistência Lendária',
  'Frightful Presence': 'Presença Aterrorizante',
  'Turn Resistance': 'Resistência a Expulsão',
  'Undead Fortitude': 'Fortitude Morta-Viva',
  'Aggressive': 'Agressivo',
  'Hold Breath': 'Prender Respiração',
  'Illumination': 'Iluminação',
  'Incorporeal Movement': 'Movimento Incorpóreo',
  'False Appearance': 'Aparência Falsa',
  'Freeze': 'Congelar',
  'Heated Body': 'Corpo Aquecido',
  'Water Susceptibility': 'Suscetibilidade à Água',
  'Flyby': 'Voo Rasante',
  'Mimicry': 'Mimetismo',
  'Nimble Escape': 'Fuga Ágil',
  'Sure-Footed': 'Pés Firmes',
  'Trampling Charge': 'Investida Atropeladora',
  'Two Heads': 'Duas Cabeças',
  'Wakeful': 'Sempre Alerta',
  'Standing Leap': 'Salto em Pé',
  'Swamp Camouflage': 'Camuflagem de Pântano',
  'Blood Frenzy': 'Frenesi de Sangue',
  'Water Breathing': 'Respiração Aquática',
  'Echolocation': 'Ecolocalização',
  'Devil\'s Sight': 'Visão do Diabo',
  'Ethereal Sight': 'Visão Etérea',
  'Detect': 'Detectar',
  'Multiattack': 'Multiataques',
  'Legendary Actions': 'Ações Lendárias',
  'Lair Actions': 'Ações de Covil',
  'Mucous Cloud': 'Nuvem Mucosa',
  'Probing Telepathy': 'Telepatia Investigativa'
}

// Traduções de nomes de ações
const actionNameTranslations: Record<string, string> = {
  'Multiattack': 'Ataques Múltiplos',
  'Bite': 'Mordida',
  'Claw': 'Garra',
  'Claws': 'Garras',
  'Tail': 'Cauda',
  'Slam': 'Golpe',
  'Fist': 'Punho',
  'Gore': 'Chifrada',
  'Hooves': 'Cascos',
  'Hoof': 'Casco',
  'Talons': 'Garras',
  'Tentacle': 'Tentáculo',
  'Tentacles': 'Tentáculos',
  'Sting': 'Ferrão',
  'Constrict': 'Constrição',
  'Shortsword': 'Espada Curta',
  'Longsword': 'Espada Longa',
  'Greataxe': 'Machado Grande',
  'Greatsword': 'Montante',
  'Scimitar': 'Cimitarra',
  'Dagger': 'Adaga',
  'Javelin': 'Azagaia',
  'Longbow': 'Arco Longo',
  'Shortbow': 'Arco Curto',
  'Crossbow': 'Besta',
  'Light Crossbow': 'Besta Leve',
  'Heavy Crossbow': 'Besta Pesada',
  'Hand Crossbow': 'Besta de Mão',
  'Spear': 'Lança',
  'Club': 'Clava',
  'Mace': 'Maça',
  'Morningstar': 'Maça Estrela',
  'Quarterstaff': 'Bordão',
  'Greatclub': 'Clava Grande',
  'Handaxe': 'Machadinha',
  'Battleaxe': 'Machado de Batalha',
  'Warhammer': 'Martelo de Guerra',
  'Maul': 'Malho',
  'Pike': 'Pique',
  'Halberd': 'Alabarda',
  'Glaive': 'Gládio',
  'Trident': 'Tridente',
  'Whip': 'Chicote',
  'Web': 'Teia',
  'Fire Breath': 'Sopro de Fogo',
  'Breath Weapon': 'Arma de Sopro',
  'Cold Breath': 'Sopro de Frio',
  'Lightning Breath': 'Sopro de Relâmpago',
  'Acid Breath': 'Sopro de Ácido',
  'Poison Breath': 'Sopro de Veneno',
  'Frightful Presence': 'Presença Aterrorizante',
  'Wing Attack': 'Ataque de Asa',
  'Tail Attack': 'Ataque de Cauda',
  'Change Shape': 'Mudar Forma',
  'Etherealness': 'Forma Etérea',
  'Teleport': 'Teleporte',
  'Charm': 'Encantar',
  'Draining Kiss': 'Beijo Drenante',
  'Read Thoughts': 'Ler Pensamentos',
  'Innate Spellcasting': 'Conjuração Inata',
  'Spellcasting': 'Conjuração',
  'Leadership': 'Liderança',
  'Parry': 'Aparar',
  'Enslave': 'Escravizar',
  'Detect': 'Detectar',
  'Tail Swipe': 'Golpe de Cauda',
  'Rock': 'Pedra',
  'Sling': 'Funda',
  'Psychic Drain': 'Drenar Psíquico'
}

const CONDITION_OPTIONS = [
  'Cego',
  'Encantado',
  'Surdos',
  'Exaustão',
  'Com medo',
  'Agarrado',
  'Incapacitado',
  'Invisível',
  'Paralisado',
  'Petrificado',
  'Envenenado',
  'Propenso',
  'Contido',
  'Estupefato',
  'Inconsciente'
]

// Traduções de termos comuns em descrições
const descriptionTerms: Array<[RegExp, string]> = [
  [/Melee Weapon Attack/gi, 'Ataque Corpo a Corpo com Arma'],
  [/Ranged Weapon Attack/gi, 'Ataque à Distância com Arma'],
  [/Melee or Ranged Weapon Attack/gi, 'Ataque Corpo a Corpo ou à Distância com Arma'],
  [/Melee Spell Attack/gi, 'Ataque Corpo a Corpo com Magia'],
  [/Ranged Spell Attack/gi, 'Ataque à Distância com Magia'],
  [/to hit/gi, 'para acertar'],
  [/reach (\d+) ft\./gi, 'alcance $1 ft.'],
  [/range (\d+)\/(\d+) ft\./gi, 'alcance $1/$2 ft.'],
  [/one target/gi, 'um alvo'],
  [/one creature/gi, 'uma criatura'],
  [/Hit:/gi, 'Acerto:'],
  [/(\d+d\d+\s*[+\-]\s*\d+)/g, '$1'],
  [/bludgeoning damage/gi, 'dano de concussão'],
  [/piercing damage/gi, 'dano perfurante'],
  [/slashing damage/gi, 'dano cortante'],
  [/fire damage/gi, 'dano de fogo'],
  [/cold damage/gi, 'dano de frio'],
  [/lightning damage/gi, 'dano elétrico'],
  [/thunder damage/gi, 'dano de trovão'],
  [/acid damage/gi, 'dano de ácido'],
  [/poison damage/gi, 'dano de veneno'],
  [/necrotic damage/gi, 'dano necrótico'],
  [/radiant damage/gi, 'dano radiante'],
  [/psychic damage/gi, 'dano psíquico'],
  [/force damage/gi, 'dano de energia'],
  [/DC (\d+)/g, 'CD $1'],
  [/saving throw/gi, 'teste de resistência'],
  [/Strength saving throw/gi, 'teste de resistência de Força'],
  [/Dexterity saving throw/gi, 'teste de resistência de Destreza'],
  [/Constitution saving throw/gi, 'teste de resistência de Constituição'],
  [/Intelligence saving throw/gi, 'teste de resistência de Inteligência'],
  [/Wisdom saving throw/gi, 'teste de resistência de Sabedoria'],
  [/Charisma saving throw/gi, 'teste de resistência de Carisma'],
  [/on a failed save/gi, 'em caso de falha'],
  [/on a successful save/gi, 'em caso de sucesso'],
  [/half as much damage/gi, 'metade do dano'],
  [/is knocked prone/gi, 'fica caído'],
  [/is grappled/gi, 'fica agarrado'],
  [/is restrained/gi, 'fica impedido'],
  [/is paralyzed/gi, 'fica paralisado'],
  [/is stunned/gi, 'fica atordoado'],
  [/is frightened/gi, 'fica amedrontado'],
  [/is charmed/gi, 'fica enfeitiçado'],
  [/is poisoned/gi, 'fica envenenado'],
  [/is blinded/gi, 'fica cego'],
  [/is deafened/gi, 'fica surdo'],
  [/is incapacitated/gi, 'fica incapacitado'],
  [/is petrified/gi, 'fica petrificado'],
  [/can breathe air and water/gi, 'pode respirar ar e água'],
  [/advantage on/gi, 'vantagem em'],
  [/disadvantage on/gi, 'desvantagem em'],
  [/attack rolls/gi, 'jogadas de ataque'],
  [/ability checks/gi, 'testes de habilidade'],
  [/within (\d+) feet/gi, 'em até $1 pés'],
  [/(\d+) feet/gi, '$1 pés']
]

const translateSize = (size: string): string => sizeTranslations[size] || size
const translateType = (type: string): string => typeTranslations[type.toLowerCase()] || type
const translateAlignment = (alignment: string): string => alignmentTranslations[alignment.toLowerCase()] || alignment
const translateDamageType = (damage: string): string => {
  const lower = damage.toLowerCase()
  for (const [en, pt] of Object.entries(damageTypeTranslations)) {
    if (lower.includes(en)) {
      return damage.replace(new RegExp(en, 'gi'), pt)
    }
  }
  return damage
}
const translateSpeed = (key: string): string => speedTranslations[key.toLowerCase()] || key
const translateSense = (key: string): string => senseTranslations[key.toLowerCase()] || key.replace('_', ' ')

const translateAbilityName = (name: string): string => abilityNameTranslations[name] || name
const translateActionName = (name: string): string => actionNameTranslations[name] || name

const translateDescription = (desc: string): string => {
  let translated = desc
  for (const [pattern, replacement] of descriptionTerms) {
    translated = translated.replace(pattern, replacement)
  }
  return translated
}

type TurnPeriodId = 'manha' | 'tarde' | 'noite' | 'madrugada'

type TurnMonitorPVRow = {
  name: string
  max: string
  current: string
}

type TurnMonitorMonsterRow = {
  group: string
  area: string
  notes: string
}

type TurnMonitorEffectRow = {
  effect: string
  duration: string
}

type SavedEncounter = {
  id: string
  name: string
  entries: InitiativeEntry<SRDMonster>[]
}

type MusicCategoryId = 'combate' | 'viagem' | 'taverna' | 'suspense' | 'exploracao' | 'cidade' | 'descanso'

type MusicTrack = {
  id: string
  name: string
  path: string
}

type MusicState = {
  categories: Record<MusicCategoryId, MusicTrack[]>
  activeCategoryId: MusicCategoryId
  activeTrackId: string | null
  isPlaying: boolean
  volume: number
  autoMode: boolean
}

type TurnMonitorData = {
  periods: Record<TurnPeriodId, boolean[][]>
  orderOfMarch: string
  orderOfWatch: string
  actions: boolean[]
  encounterTable: string[]
  encounterTable20: string[]
  encounterEnvironment: EncounterEnvironment
  encounterDifficulty: EncounterDifficulty
  pvRows: TurnMonitorPVRow[]
  monsterRows: TurnMonitorMonsterRow[]
  effectRows: TurnMonitorEffectRow[]
  encounters: SavedEncounter[]
  music: MusicState
}

type EncounterEnvironment =
  | 'floresta'
  | 'deserto'
  | 'montanha'
  | 'pantano'
  | 'urbano'
  | 'masmorra'
  | 'costeiro'

type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'deadly'

const TURN_ROW_COUNT = 6
const TURN_COLUMN_COUNT = 6
const PV_ROW_COUNT = 6
const EFFECT_ROW_COUNT = 6
const MONSTER_ROW_COUNT = 6

const MUSIC_CATEGORIES: Array<{ id: MusicCategoryId; label: string }> = [
  { id: 'combate', label: 'Combate' },
  { id: 'viagem', label: 'Viagem' },
  { id: 'taverna', label: 'Taverna' },
  { id: 'suspense', label: 'Suspense' },
  { id: 'exploracao', label: 'Exploração' },
  { id: 'cidade', label: 'Cidade' },
  { id: 'descanso', label: 'Descanso' }
]

const MUSIC_KEYWORDS: Record<MusicCategoryId, string[]> = {
  combate: ['iniciativa', 'combate', 'atacar', 'batalha', 'inimigos'],
  viagem: ['viagem', 'estrada', 'caminho', 'partida', 'rumo'],
  taverna: ['taverna', 'estalagem', 'bebida', 'caneca'],
  suspense: ['suspeito', 'estranho', 'sombras', 'medo', 'cuidado'],
  exploracao: ['explorar', 'exploração', 'caverna', 'ruínas', 'vasculhar'],
  cidade: ['cidade', 'mercado', 'rua', 'guarda', 'praça'],
  descanso: ['descanso', 'repouso', 'acampamento', 'sono', 'parada']
}

const TURN_PERIODS = [
  { id: 'manha' as TurnPeriodId, label: 'Período da manhã' },
  { id: 'tarde' as TurnPeriodId, label: 'Período da tarde' },
  { id: 'noite' as TurnPeriodId, label: 'Período da noite' },
  { id: 'madrugada' as TurnPeriodId, label: 'Período da madrugada' }
]

const TURN_ROWS = Array.from({ length: TURN_ROW_COUNT }, (_, index) => index + 1)
const TURN_COLUMNS = Array.from({ length: TURN_COLUMN_COUNT }, (_, index) => index + 1)

const DUNGEON_ACTIONS = [
  'Movimentar-se',
  'Conversar',
  'Procurar',
  'Ultrapassar obstáculo',
  'Ficar atento aos arredores',
  'Conjurar ritual',
  'Combater',
  'Ajudar um ao outro',
  'Outras ações'
]

const ENCOUNTER_ROLLS = ['1-2', '3', '4', '5', '6', '7', '8', '9', '10']
const ENCOUNTER_ROLLS_20 = Array.from({ length: 20 }, (_, index) => `${index + 1}`)

const REACTION_TABLE = [
  { roll: '2-3', result: 'Ataca na hora' },
  { roll: '4-6', result: 'Hostil, pode atacar' },
  { roll: '7-9', result: 'Incerto, ameaçado' },
  { roll: '10-11', result: 'Neutro, pode negociar' },
  { roll: '12+', result: 'Amigável' }
]

const ENCOUNTER_ENVIRONMENTS: Array<{ id: EncounterEnvironment; label: string }> = [
  { id: 'floresta', label: 'Floresta' },
  { id: 'deserto', label: 'Deserto' },
  { id: 'montanha', label: 'Montanha' },
  { id: 'pantano', label: 'Pântano' },
  { id: 'urbano', label: 'Urbano' },
  { id: 'masmorra', label: 'Masmorra' },
  { id: 'costeiro', label: 'Costeiro' }
]

const ENCOUNTER_DIFFICULTIES: Array<{ id: EncounterDifficulty; label: string }> = [
  { id: 'easy', label: 'Fácil' },
  { id: 'medium', label: 'Médio' },
  { id: 'hard', label: 'Difícil' },
  { id: 'deadly', label: 'Mortal' }
]

const ENCOUNTER_TABLES: Record<EncounterEnvironment, Record<EncounterDifficulty, string[]>> = {
  floresta: {
    easy: [
      '1d4 lobos',
      '1d6 goblins exploradores',
      '1d4 javalis',
      '1d4 bandidos',
      '1d6 kobolds',
      '1 urso negro',
      '1d4 aranhas grandes',
      '1d4 batedores élficos',
      '1d6 esqueletos',
      '1d4 lobos gigantes'
    ],
    medium: [
      '1d6 lobos + 1 lobo gigante',
      '1d8 goblins',
      '1d4 ursos negros',
      '1d6 hobgoblins',
      '1d4 aranhas gigantes',
      '1 druida + 1d4 animais',
      '1d4 saqueadores orcs',
      '1 espírito da floresta',
      '1d6 zumbis errantes',
      '1d4 corredores worg'
    ],
    hard: [
      '1 urso-coruja',
      '1d6 orcs + 1 chefe orc',
      '1d4 worgs + 1d4 goblins',
      '1 treant ferido',
      '1d6 dríades + 1d4 lobos',
      '1 troll faminto',
      '1d6 espectros',
      '1d4 ogros',
      '1 quimera jovem',
      '1d6 lobos terríveis'
    ],
    deadly: [
      '1 hidra jovem',
      '1 druida + 1 elemental do ar',
      '1 gigante das colinas',
      '1 dragão verde jovem',
      '1d4 trolls',
      '1d6 ogros + 1 ogro mago',
      '1 bando de licantropos',
      '1d4 mantícoras',
      '1 entidade férica antiga',
      '1d6 worgs + 1d6 goblins'
    ]
  },
  deserto: {
    easy: [
      '1d4 escorpiões gigantes',
      '1d6 bandidos do deserto',
      '1d4 chacais',
      '1d4 kobolds perdidos',
      '1d6 esqueletos',
      '1d4 abutres',
      '1 saqueador gnoll',
      '1d4 cultistas',
      '1d6 lagartos do deserto',
      '1d4 mercenários'
    ],
    medium: [
      '1d6 gnolls',
      '1d4 escorpiões gigantes + 1 enxame',
      '1d6 hobgoblins',
      '1d4 saqueadores orcs',
      '1 elemental de areia',
      '1d4 lagartos gigantes',
      '1d6 esqueletos + 1 morto-vivo',
      '1d4 camelos selvagens',
      '1d4 bandidos + 1 líder',
      '1d6 kobolds + 1 dracólito'
    ],
    hard: [
      '1 manticora',
      '1d4 ogros',
      '1d6 gnolls + 1 chefe gnoll',
      '1 verme púrpura juvenil',
      '1d4 elementais menores',
      '1d6 espectros do deserto',
      '1 gigante das colinas',
      '1d4 salamandras',
      '1 naga guardiã',
      '1 dragão azul jovem'
    ],
    deadly: [
      '1 dragão azul adulto',
      '1 esfinge',
      '1d4 gigantes das colinas',
      '1 marid irado',
      '1 colosso de pedra',
      '1d6 salamandras + 1 efreeti',
      '1d4 manticoras',
      '1 devorador de areia',
      '1d6 espectros + 1 espectro maior',
      '1 verme púrpura'
    ]
  },
  montanha: {
    easy: [
      '1d4 cabras monteses',
      '1d6 batedores goblins',
      '1d4 lobos gigantes',
      '1d4 bandoleiros',
      '1d6 kobolds da rocha',
      '1 águia gigante',
      '1d4 aranhas grandes',
      '1d4 cultistas',
      '1d6 esqueletos',
      '1d4 hobgoblins'
    ],
    medium: [
      '1d4 ogros',
      '1d6 orcs',
      '1 urso-coruja',
      '1d4 harpias',
      '1 elemental do ar menor',
      '1d4 salamandras',
      '1d6 hobgoblins',
      '1d4 gigantes de pedra jovens',
      '1d6 cultistas + 1 acólito',
      '1d4 trolls das montanhas'
    ],
    hard: [
      '1 gigante das pedras',
      '1d4 mantícoras',
      '1d6 ogros + 1 ogro mago',
      '1 wyvern',
      '1d4 elemental do ar',
      '1 dragão branco jovem',
      '1d6 trolls',
      '1d4 gigantes do gelo jovens',
      '1d6 harpias + 1 líder',
      '1 golem de pedra'
    ],
    deadly: [
      '1 dragão vermelho jovem',
      '1 gigante do gelo',
      '1d4 wyverns',
      '1 roc',
      '1d4 gigantes das pedras',
      '1 elemental do ar maior',
      '1d6 mantícoras',
      '1 dragão branco adulto',
      '1d4 trolls + 1 troll mago',
      '1 colosso das montanhas'
    ]
  },
  pantano: {
    easy: [
      '1d4 sapos gigantes',
      '1d6 kobolds',
      '1d4 zombies',
      '1d4 sanguessugas gigantes',
      '1d6 bandidos',
      '1 enxame de insetos',
      '1d4 goblins',
      '1d4 cultistas',
      '1d6 rãs venenosas',
      '1d4 crocodilos'
    ],
    medium: [
      '1d4 homens-lagarto',
      '1d6 mortos-vivos',
      '1d4 jacarés gigantes',
      '1d6 hobgoblins',
      '1 bruxa do pântano',
      '1d4 yuan-ti batedores',
      '1d6 espectros',
      '1d4 ogros',
      '1d6 cultistas + 1 líder',
      '1d4 aranhas gigantes'
    ],
    hard: [
      '1 troll',
      '1d4 yuan-ti',
      '1d6 homens-lagarto + 1 chefe',
      '1 hydra jovem',
      '1d4 ogros + 1 ogro mago',
      '1d6 espectros + 1 wraith',
      '1 bruxa + 1d4 mortos-vivos',
      '1 elemental de água',
      '1d4 crocodilos gigantes',
      '1 beholder cinzento'
    ],
    deadly: [
      '1 hydra',
      '1 beholder',
      '1 dragão negro jovem',
      '1d4 trolls',
      '1 elemental de água maior',
      '1 naga guardiã',
      '1d6 yuan-ti + 1 abominação',
      '1 colosso do pântano',
      '1 enxame de mortos-vivos',
      '1d4 crocodilos gigantes + 1 alfa'
    ]
  },
  urbano: {
    easy: [
      '1d4 ladrões',
      '1d6 guardas corruptos',
      '1d4 batedores',
      '1d6 cultistas',
      '1 enxame de ratos',
      '1d4 bandidos',
      '1d6 mercenários',
      '1d4 agitadores',
      '1d6 espiões',
      '1d4 vigias'
    ],
    medium: [
      '1d6 veteranos',
      '1d4 assassinos',
      '1d6 guardas',
      '1d4 cultistas + 1 líder',
      '1d4 bandidos + 1 capitão',
      '1d6 mercenários',
      '1 mago aprendiz',
      '1d6 saqueadores',
      '1d4 rufiões',
      '1d6 espiões'
    ],
    hard: [
      '1d4 veteranos + 1 capitão',
      '1 assassino + 1d4 batedores',
      '1d6 guarda de elite',
      '1d4 cultistas + 1 sacerdote',
      '1 goleiro arcano',
      '1d4 mercenários + 1 líder',
      '1d4 bandidos + 1 mago',
      '1d6 monstros disfarçados',
      '1d4 demônios menores',
      '1d4 caçadores de recompensas'
    ],
    deadly: [
      '1 arquimago',
      '1d4 guardas de elite + 1 capitão',
      '1 assassino lendário',
      '1d4 demônios + 1 invocador',
      '1 vampiro',
      '1 lich disfarçado',
      '1d4 caçadores de recompensa veteranos',
      '1d6 monstros disfarçados + 1 chefe',
      '1d4 campeões sagrados',
      '1 dragão disfarçado'
    ]
  },
  masmorra: {
    easy: [
      '1d6 esqueletos',
      '1d4 kobolds',
      '1d6 goblins',
      '1d4 zumbis',
      '1 enxame de ratos',
      '1d4 bandidos',
      '1d6 cultistas',
      '1d4 aranhas grandes',
      '1d6 slimes',
      '1d4 guardas de ruína'
    ],
    medium: [
      '1d6 mortos-vivos',
      '1d4 hobgoblins',
      '1d6 orcs',
      '1d4 ogros',
      '1d6 cultistas + 1 líder',
      '1d4 aranhas gigantes',
      '1d4 aberrações menores',
      '1d6 espectros',
      '1d4 slimes + 1 otyugh',
      '1d6 kobolds + 1 dracólito'
    ],
    hard: [
      '1 beholder menor',
      '1d4 ogros + 1 ogro mago',
      '1d6 trolls',
      '1d4 elementais',
      '1d4 aberrações',
      '1d6 mortos-vivos + 1 wraith',
      '1d4 guardas espectrais',
      '1d6 orcs + 1 chefe orc',
      '1 gelatinous cube',
      '1 wyvern subterrâneo'
    ],
    deadly: [
      '1 beholder',
      '1d4 wraiths',
      '1 dragão vermelho jovem',
      '1d4 ogros magos',
      '1d6 trolls + 1 troll mago',
      '1d4 aberrações maiores',
      '1 lich',
      '1 demon lord menor',
      '1 guardião titânico',
      '1 colosso arcano'
    ]
  },
  costeiro: {
    easy: [
      '1d6 bandidos costeiros',
      '1d4 saqueadores',
      '1 enxame de gaivotas',
      '1d4 caranguejos gigantes',
      '1d6 piratas',
      '1d4 tritões',
      '1d6 kobolds',
      '1d4 sahuagin batedores',
      '1d4 marinheiros',
      '1d6 cultistas'
    ],
    medium: [
      '1d6 sahuagin',
      '1d4 piratas + 1 capitão',
      '1 elemental de água menor',
      '1d4 caranguejos gigantes + 1 enxame',
      '1d6 tritões',
      '1d4 bandidos + 1 líder',
      '1d6 mercenários',
      '1d4 mortos-vivos afogados',
      '1d6 kobolds + 1 dracólito',
      '1d4 místicos do mar'
    ],
    hard: [
      '1 elemental de água',
      '1d4 sahuagin + 1 barão',
      '1 hydra jovem',
      '1d4 piratas veteranos',
      '1d6 tritões + 1 líder',
      '1d4 mortos-vivos + 1 wraith',
      '1d4 mantícoras',
      '1d6 ogros',
      '1 bruxa marinha',
      '1 dragão de bronze jovem'
    ],
    deadly: [
      '1 kraken juvenil',
      '1 dragão de bronze adulto',
      '1 elemental de água maior',
      '1d4 sahuagin + 1 campeão',
      '1 hydra',
      '1 leviatã',
      '1d6 mantícoras',
      '1d4 ogros magos',
      '1 colosso marítimo',
      '1 frota pirata hostil'
    ]
  }
}

const ENCOUNTER_TABLES_20: Record<EncounterEnvironment, string[]> = {
  floresta: [
    'Mercador itinerante perdido',
    'Animal ferido na trilha',
    'Pegadas recentes e fogueira apagada',
    'Tempestade repentina no bosque',
    'Acampamento abandonado',
    'Armadilha de caçador',
    'Batedores aliados pedindo ajuda',
    'Viajantes assustados com algo ao norte',
    'Ruínas cobertas por musgo',
    'Encontro hostil (role na tabela 1d10 - {difficulty})',
    'Caravana bloqueada por árvore caída',
    'Animal místico observa o grupo',
    'Trovão distante, algo se aproxima',
    'Totem antigo com avisos',
    'Bando de corvos inquietos',
    'Encontro curioso (role na tabela 1d10 - {difficulty})',
    'Caminho alternativo perigoso',
    'Caçadores discutindo recompensa',
    'Vestígios de combate recente',
    'Encontro perigoso (role na tabela 1d10 - {difficulty})'
  ],
  deserto: [
    'Mercador com sede pede água',
    'Animal perdido no calor',
    'Oásis distante (real ou miragem)',
    'Tempestade de areia se aproxima',
    'Carcaça gigante na areia',
    'Pegadas frescas cruzam a trilha',
    'Caravana protegida por mercenários',
    'Ruínas soterradas emergindo',
    'Viajantes exaustos pedem abrigo',
    'Encontro hostil (role na tabela 1d10 - {difficulty})',
    'Bandidos negociam passagem',
    'Totem antigo com aviso de perigo',
    'Animal assustado foge para o norte',
    'Sopro gelado vindo de caverna',
    'Relâmpago seco no horizonte',
    'Encontro curioso (role na tabela 1d10 - {difficulty})',
    'Dunas desmoronam revelando túnel',
    'Mercador oferece mapa suspeito',
    'Eco de tambores distantes',
    'Encontro perigoso (role na tabela 1d10 - {difficulty})'
  ],
  montanha: [
    'Mercador bloqueado por deslizamento',
    'Animal preso em fenda',
    'Eco estranho vindo de caverna',
    'Avalanche distante',
    'Acampamento destruído pelo frio',
    'Trilha segura marcada com pedras',
    'Escoteiros aliados pedem ajuda',
    'Viajantes buscando abrigo',
    'Ruína em penhasco',
    'Encontro hostil (role na tabela 1d10 - {difficulty})',
    'Bando de cabras monteses cruza o caminho',
    'Névoa densa cobre o vale',
    'Sinais de dragão recente',
    'Ponte improvisada instável',
    'Luzes misteriosas na crista',
    'Encontro curioso (role na tabela 1d10 - {difficulty})',
    'Caminho bloqueado por rochas',
    'Santuário de montanha',
    'Vestígios de batalha antiga',
    'Encontro perigoso (role na tabela 1d10 - {difficulty})'
  ],
  pantano: [
    'Mercador perdido em lamaçal',
    'Animal assustado preso na lama',
    'Neblina densa reduz visibilidade',
    'Ruído estranho na água',
    'Ponte de troncos apodrecidos',
    'Totem com avisos de perigo',
    'Viajantes adoentados pedem ajuda',
    'Sussurros na névoa',
    'Ruínas submersas',
    'Encontro hostil (role na tabela 1d10 - {difficulty})',
    'Ervas raras surgem no caminho',
    'Sinais de criatura grande',
    'Tempestade se aproxima',
    'Luzes estranhas sobre a água',
    'Bando de aves inquietas',
    'Encontro curioso (role na tabela 1d10 - {difficulty})',
    'Caminho alternativo perigoso',
    'Caçadores de pântano pedem ajuda',
    'Vestígios de ritual',
    'Encontro perigoso (role na tabela 1d10 - {difficulty})'
  ],
  urbano: [
    'Mercador oferece itens raros',
    'Animal perdido causa confusão',
    'Bando de crianças pede ajuda',
    'Guarda faz inspeção',
    'Rumor de crime recente',
    'Cartaz de recompensa chamativo',
    'Viajante perdido procura abrigo',
    'Procissão religiosa bloqueia a rua',
    'Pequena briga em taverna',
    'Encontro hostil (role na tabela 1d10 - {difficulty})',
    'Mercador quer escolta',
    'Artista de rua chama atenção',
    'Alguém segue o grupo',
    'Guarda pede suborno',
    'Incêndio em um prédio próximo',
    'Encontro curioso (role na tabela 1d10 - {difficulty})',
    'Investigador busca testemunhas',
    'Mensageiro traz notícia urgente',
    'Sinos anunciam perigo',
    'Encontro perigoso (role na tabela 1d10 - {difficulty})'
  ],
  masmorra: [
    'Mercador perdido em corredor',
    'Animal assustado em jaula',
    'Sussurros atrás da parede',
    'Armadilha recém-ativada',
    'Sala abandonada com suprimentos',
    'Ruído de engrenagens',
    'Viajantes presos pedem ajuda',
    'Rastro de sangue recente',
    'Grafites alertam perigo',
    'Encontro hostil (role na tabela 1d10 - {difficulty})',
    'Corrente de ar gelado',
    'Luz estranha ao longe',
    'Sinais de culto recente',
    'Porta secreta entreaberta',
    'Borras de poção no chão',
    'Encontro curioso (role na tabela 1d10 - {difficulty})',
    'Ecos de combate distante',
    'Rato gigante carrega chave',
    'Câmara ritual intacta',
    'Encontro perigoso (role na tabela 1d10 - {difficulty})'
  ],
  costeiro: [
    'Mercador espera por maré',
    'Animal marinho perdido na praia',
    'Naufrágio recente',
    'Bruma densa sobre o mar',
    'Pescadores pedem ajuda',
    'Sinais de piratas',
    'Viajantes aguardam balsa',
    'Farol apagado',
    'Ruínas costeiras',
    'Encontro hostil (role na tabela 1d10 - {difficulty})',
    'Barqueiro oferece passagem',
    'Navio desconhecido no horizonte',
    'Bando de gaivotas agitadas',
    'Tempestade se aproxima',
    'Sinais de criatura marinha',
    'Encontro curioso (role na tabela 1d10 - {difficulty})',
    'Mercador pede escolta',
    'Guardas costeiros patrulham',
    'Tesouro encalhado',
    'Encontro perigoso (role na tabela 1d10 - {difficulty})'
  ]
}

const isEncounterEnvironment = (value: string): value is EncounterEnvironment =>
  ENCOUNTER_ENVIRONMENTS.some((env) => env.id === value)

const isEncounterDifficulty = (value: string): value is EncounterDifficulty =>
  ENCOUNTER_DIFFICULTIES.some((diff) => diff.id === value)

const createDefaultMusicState = (): MusicState => ({
  categories: {
    combate: [],
    viagem: [],
    taverna: [],
    suspense: [],
    exploracao: [],
    cidade: [],
    descanso: []
  },
  activeCategoryId: 'exploracao',
  activeTrackId: null,
  isPlaying: false,
  volume: 0.65,
  autoMode: true
})

const createDefaultTurnMonitorData = (): TurnMonitorData => ({
  periods: {
    manha: Array.from({ length: TURN_ROW_COUNT }, () => Array(TURN_COLUMN_COUNT).fill(false)),
    tarde: Array.from({ length: TURN_ROW_COUNT }, () => Array(TURN_COLUMN_COUNT).fill(false)),
    noite: Array.from({ length: TURN_ROW_COUNT }, () => Array(TURN_COLUMN_COUNT).fill(false)),
    madrugada: Array.from({ length: TURN_ROW_COUNT }, () => Array(TURN_COLUMN_COUNT).fill(false))
  },
  orderOfMarch: '',
  orderOfWatch: '',
  actions: Array(DUNGEON_ACTIONS.length).fill(false),
  encounterTable: Array(ENCOUNTER_ROLLS.length).fill(''),
  encounterTable20: Array.from({ length: ENCOUNTER_ROLLS_20.length }, (_, index) =>
    ENCOUNTER_TABLES_20.floresta[index] ?? ''
  ),
  encounterEnvironment: 'floresta',
  encounterDifficulty: 'medium',
  pvRows: Array.from({ length: PV_ROW_COUNT }, () => ({ name: '', max: '', current: '' })),
  monsterRows: Array.from({ length: MONSTER_ROW_COUNT }, () => ({ group: '', area: '', notes: '' })),
  effectRows: Array.from({ length: EFFECT_ROW_COUNT }, () => ({ effect: '', duration: '' })),
  encounters: [],
  music: createDefaultMusicState()
})

const normalizeArray = <T,>(value: T[] | undefined, length: number, fallback: T): T[] => {
  return Array.from({ length }, (_, index) => value?.[index] ?? fallback)
}

const normalizeTurnMonitorData = (value?: Partial<TurnMonitorData> | null): TurnMonitorData => {
  const defaults = createDefaultTurnMonitorData()
  if (!value) return defaults
  const normalizedEnvironment =
    value.encounterEnvironment && isEncounterEnvironment(value.encounterEnvironment)
      ? value.encounterEnvironment
      : defaults.encounterEnvironment
  const normalizedDifficulty =
    value.encounterDifficulty && isEncounterDifficulty(value.encounterDifficulty)
      ? value.encounterDifficulty
      : defaults.encounterDifficulty
  const normalizeTurnPeriod = (periodValue?: boolean[] | boolean[][]) => {
    if (Array.isArray(periodValue) && Array.isArray(periodValue[0])) {
      return Array.from({ length: TURN_ROW_COUNT }, (_, rowIndex) =>
        normalizeArray(periodValue[rowIndex] as boolean[] | undefined, TURN_COLUMN_COUNT, false)
      )
    }

    if (Array.isArray(periodValue)) {
      const firstRow = normalizeArray(periodValue as boolean[], TURN_COLUMN_COUNT, false)
      const remainingRows = Array.from({ length: TURN_ROW_COUNT - 1 }, () =>
        Array(TURN_COLUMN_COUNT).fill(false)
      )
      return [firstRow, ...remainingRows]
    }

    return Array.from({ length: TURN_ROW_COUNT }, () => Array(TURN_COLUMN_COUNT).fill(false))
  }

  const periods = TURN_PERIODS.reduce((acc, period) => {
    acc[period.id] = normalizeTurnPeriod(value.periods?.[period.id])
    return acc
  }, {} as Record<TurnPeriodId, boolean[][]>)

  const incomingMusic: Partial<MusicState> = value.music ?? {}
  const defaultMusic = defaults.music
  const normalizedMusic: MusicState = {
    categories: {
      combate: incomingMusic.categories?.combate ?? defaultMusic.categories.combate,
      viagem: incomingMusic.categories?.viagem ?? defaultMusic.categories.viagem,
      taverna: incomingMusic.categories?.taverna ?? defaultMusic.categories.taverna,
      suspense: incomingMusic.categories?.suspense ?? defaultMusic.categories.suspense,
      exploracao: incomingMusic.categories?.exploracao ?? defaultMusic.categories.exploracao,
      cidade: incomingMusic.categories?.cidade ?? defaultMusic.categories.cidade,
      descanso: incomingMusic.categories?.descanso ?? defaultMusic.categories.descanso
    },
    activeCategoryId: incomingMusic.activeCategoryId ?? defaultMusic.activeCategoryId,
    activeTrackId: incomingMusic.activeTrackId ?? defaultMusic.activeTrackId,
    isPlaying: incomingMusic.isPlaying ?? defaultMusic.isPlaying,
    volume: typeof incomingMusic.volume === 'number' ? incomingMusic.volume : defaultMusic.volume,
    autoMode: typeof incomingMusic.autoMode === 'boolean' ? incomingMusic.autoMode : defaultMusic.autoMode
  }
  const normalizedEncounters = Array.isArray(value.encounters)
    ? value.encounters
        .filter((encounter): encounter is SavedEncounter =>
          Boolean(encounter && encounter.id && encounter.name && Array.isArray(encounter.entries))
        )
        .map((encounter) => ({
          id: encounter.id,
          name: encounter.name,
          entries: Array.isArray(encounter.entries) ? encounter.entries : []
        }))
    : []

  return {
    ...defaults,
    ...value,
    periods,
    actions: normalizeArray(value.actions, DUNGEON_ACTIONS.length, false),
    encounterTable: normalizeArray(value.encounterTable, ENCOUNTER_ROLLS.length, ''),
    encounterTable20: normalizeArray(value.encounterTable20, ENCOUNTER_ROLLS_20.length, ''),
    encounterEnvironment: normalizedEnvironment,
    encounterDifficulty: normalizedDifficulty,
    pvRows: Array.from({ length: PV_ROW_COUNT }, (_, index) => ({
      name: value.pvRows?.[index]?.name ?? '',
      max: value.pvRows?.[index]?.max ?? '',
      current: value.pvRows?.[index]?.current ?? ''
    })),
    monsterRows: Array.from({ length: MONSTER_ROW_COUNT }, (_, index) => ({
      group: value.monsterRows?.[index]?.group ?? '',
      area: value.monsterRows?.[index]?.area ?? '',
      notes: value.monsterRows?.[index]?.notes ?? ''
    })),
    effectRows: Array.from({ length: EFFECT_ROW_COUNT }, (_, index) => ({
      effect: value.effectRows?.[index]?.effect ?? '',
      duration: value.effectRows?.[index]?.duration ?? ''
    })),
    encounters: normalizedEncounters,
    music: normalizedMusic
  }
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
  const [isMasterNoteOpen, setIsMasterNoteOpen] = useState(false)
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
    notes: '',
    sheetUrl: ''
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
  const {
    campaign,
    sessions,
    players,
    npcs,
    quests,
    locations,
    storyEvents,
    masterNote,
    masterNoteContent,
    setMasterNoteContent,
    setMasterNote,
    turnMonitor,
    setTurnMonitor,
    turnMonitorStatus,
    hasLoadedTurnMonitorRef,
    loadSessions,
    loadPlayers,
    loadNpcs,
    loadQuests,
    saveTurnMonitor
  } = useCampaignData<Campaign, Session, PlayerCharacter, NPC, Quest, Location, StoryEvent, MasterNote, TurnMonitorData>({
    campaignId,
    createDefaultTurnMonitorData,
    normalizeTurnMonitorData
  })
  const [srdMonsters, setSrdMonsters] = useState<SRDMonster[]>([])
  const [pinnedMonsters, setPinnedMonsters] = useState<Array<{
    id: number
    monster: SRDMonster
    position: { x: number; y: number }
  }>>([])
  const [draggingMonsterId, setDraggingMonsterId] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const nextMonsterPopupId = useRef(1)
  const [monsterImageCache, setMonsterImageCache] = useState<Record<string, string | null>>({})
  const [loadingMonsterImage, setLoadingMonsterImage] = useState(false)
  const [dragMusicCategoryId, setDragMusicCategoryId] = useState<MusicCategoryId | null>(null)
  const {
    addTracksToCategory,
    addTracksFromDrop,
    removeTrack,
    setActiveTrack,
    togglePlay,
    stopPlayback,
    playCategoryRandom
  } = useMusicController<MusicCategoryId, TurnMonitorData>({
    turnMonitor,
    setTurnMonitor,
    categories: MUSIC_CATEGORIES,
    keywords: MUSIC_KEYWORDS
  })
  const startCombatMusic = useCallback(() => {
    playCategoryRandom('combate')
  }, [playCategoryRandom])
  const {
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
  } = useCombatTracker<SRDMonster, TurnMonitorData>({
    turnMonitor,
    setTurnMonitor,
    onInitiativeStart: startCombatMusic
  })
  const {
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
  } = useTurnMonitorControls<
    TurnPeriodId,
    EncounterEnvironment,
    EncounterDifficulty,
    TurnMonitorPVRow,
    TurnMonitorMonsterRow,
    TurnMonitorEffectRow,
    TurnMonitorData
  >({
    turnMonitor,
    setTurnMonitor,
    encounterRolls: ENCOUNTER_ROLLS,
    encounterRolls20: ENCOUNTER_ROLLS_20,
    encounterTables: ENCOUNTER_TABLES,
    encounterTables20: ENCOUNTER_TABLES_20,
    encounterDifficulties: ENCOUNTER_DIFFICULTIES,
    fallbackDifficultyId: 'medium'
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
    setPlayerForm((prev) => {
      if (prev.proficiencyBonus === computedProficiencyBonus) return prev
      return {
        ...prev,
        proficiencyBonus: computedProficiencyBonus
      }
    })
  }, [computedProficiencyBonus])

  useEffect(() => {
    const loadMonsters = async () => {
      try {
        const data = await window.electron.monsters.getAll()
        setSrdMonsters(data)
      } catch (error) {
        console.error('Erro ao carregar monstros:', error)
      }
    }
    loadMonsters()
  }, [])

  // Carrega imagem dos monstros fixados
  useEffect(() => {
    const monstersWithImages = pinnedMonsters.filter(p => p.monster.image && monsterImageCache[p.monster.image] === undefined)
    if (monstersWithImages.length === 0) return
    
    const loadImages = async () => {
      setLoadingMonsterImage(true)
      for (const pinned of monstersWithImages) {
        const imagePath = pinned.monster.image!
        try {
          const dataUrl = await window.electron.monsters.getImage(imagePath)
          setMonsterImageCache(prev => ({ ...prev, [imagePath]: dataUrl }))
        } catch (error) {
          console.error('Erro ao carregar imagem:', error)
          setMonsterImageCache(prev => ({ ...prev, [imagePath]: null }))
        }
      }
      setLoadingMonsterImage(false)
    }
    loadImages()
  }, [pinnedMonsters, monsterImageCache])

  // Drag do popup de monstro
  useEffect(() => {
    if (draggingMonsterId === null) return

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setPinnedMonsters(prev => prev.map(p => 
        p.id === draggingMonsterId 
          ? { ...p, position: { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y } }
          : p
      ))
    }

    const handleMouseUp = () => {
      setDraggingMonsterId(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingMonsterId, dragOffset])


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
      notes: '',
      sheetUrl: ''
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
      notes: player.notes || '',
      sheetUrl: player.sheetUrl || ''
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
      notes: playerForm.notes || undefined,
      sheetUrl: playerForm.sheetUrl || undefined
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

  const applyXpAwards = async (awards: Array<{ id: string; amount: number }>) => {
    const updates = awards.filter((award) => award.amount > 0)
    if (updates.length === 0) return

    const playerById = new Map(players.map((player) => [player.id, player]))

    try {
      await Promise.all(
        updates.map((award) => {
          const player = playerById.get(award.id)
          if (!player) return Promise.resolve()
          const currentXp = player.experience || 0
          const payload = buildPlayerUpdatePayload(player, { experience: currentXp + award.amount })
          return window.electron.players.update(award.id, payload)
        })
      )
      loadPlayers()
    } catch (error) {
      console.error('Erro ao aplicar XP:', error)
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
      console.error('Erro ao salvar anotações do mestre:', error)
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
      console.error('Erro ao remover inspiração:', error)
    }
  }

  const openMonsterStats = (monster: SRDMonster, event?: { clientX: number; clientY: number }) => {
    const fallback = { x: 120, y: 120 }
    const position = event
      ? { x: event.clientX + 15, y: event.clientY + 15 }
      : fallback
    const newPopup = {
      id: nextMonsterPopupId.current++,
      monster,
      position
    }
    setPinnedMonsters((prev) => [...prev, newPopup])
  }

  const handlePinnedMonsterDragStart = (
    pinnedId: number,
    position: { x: number; y: number },
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    setDraggingMonsterId(pinnedId)
    setDragOffset({
      x: event.clientX - position.x,
      y: event.clientY - position.y
    })
  }

  const handlePinnedMonsterClose = (pinnedId: number) => {
    setPinnedMonsters((prev) => prev.filter((pinned) => pinned.id !== pinnedId))
  }

  const handlePinnedMonsterAddToInitiative = (monster: SRDMonster) => {
    openAddToInitiative({
      type: 'monster',
      name: monster.name,
      monsterData: monster,
      hp: monster.hit_points,
      maxHp: monster.hit_points,
      ac: monster.armor_class[0]?.value
    })
  }

  const isInInitiative = (type: 'player' | 'monster', sourceId?: string) => {
    return initiativeList.some((entry) => {
      if (entry.type !== type) return false
      if (sourceId && entry.sourceId === sourceId) return true
      return false
    })
  }

  const getInitiativeTypeLabel = (entry: InitiativeEntry) => {
    if (entry.side) return entry.side === 'ally' ? 'Aliado' : 'Inimigo'
    return entry.type === 'player' ? 'Jogador' : 'Criatura'
  }

  const isMonsterInInitiative = (name?: string) => {
    if (!name) return false
    return initiativeList.some((entry) => entry.type === 'monster' && entry.name === name)
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

  useEffect(() => {
    if (!hasLoadedTurnMonitorRef.current) return
    const timer = setTimeout(() => {
      saveTurnMonitor(turnMonitor, false)
    }, 700)
    return () => clearTimeout(timer)
  }, [saveTurnMonitor, turnMonitor])

  const formatDate = (value?: Date | null) => {
    if (!value) return 'Sem sessões'
    return new Date(value).toLocaleDateString('pt-BR')
  }

  const handleOpenDmShield = useCallback(() => {
    void window.electron.dmShield.open()
  }, [])

  const turnMonitorStatusLabel =
    turnMonitorStatus === 'saving'
      ? 'Salvando...'
      : turnMonitorStatus === 'saved'
        ? 'Salvo'
        : turnMonitorStatus === 'error'
          ? 'Erro ao salvar'
          : ''

  return (
    <div className="campaign-dashboard">
      <HeroPanel
        campaignName={campaign?.name}
        stats={stats}
        formatDate={formatDate}
        onStartSession={onStartSession}
        onReload={loadSessions}
        onOpenDmShield={handleOpenDmShield}
      />

      <section className="dashboard-grid">
        <TimelinePanel sessions={sessions} formatDate={formatDate} />

        <NpcPanel
          npcs={npcs}
          npcForm={npcForm}
          isNpcModalOpen={isNpcModalOpen}
          isNpcReadOnly={isNpcReadOnly}
          editingNpcId={editingNpcId}
          onCreate={startCreateNpc}
          onView={startViewNpc}
          onEdit={startEditNpc}
          onDelete={handleDeleteNpc}
          onCloseModal={() => setIsNpcModalOpen(false)}
          onSave={handleSaveNpc}
          setNpcForm={setNpcForm}
        />

        <PlayerPanel
          players={players}
          playerForm={playerForm}
          savingThrowEntries={savingThrowEntries}
          skillEntries={skillEntries}
          computedProficiencyBonus={computedProficiencyBonus}
          isEditingPlayer={isEditingPlayer}
          editingPlayerId={editingPlayerId}
          isInInitiative={isInInitiative}
          openAddToInitiative={openAddToInitiative}
          startCreatePlayer={startCreatePlayer}
          startEditPlayer={startEditPlayer}
          handleDeletePlayer={handleDeletePlayer}
          adjustPlayerHitPoints={adjustPlayerHitPoints}
          clearPlayerInspiration={clearPlayerInspiration}
          handleSavePlayer={handleSavePlayer}
          setIsEditingPlayer={setIsEditingPlayer}
          setPlayerForm={setPlayerForm}
          setSavingThrowEntries={setSavingThrowEntries}
          setSkillEntries={setSkillEntries}
          abilityMod={abilityMod}
          formatMod={formatMod}
          getAbilityMod={getAbilityMod}
          getProficiencyBonusValue={getProficiencyBonusValue}
          savingThrowAbilityMap={savingThrowAbilityMap}
          skillAbilityMap={skillAbilityMap}
        />

        <XpReportPanel players={players} onApplyXp={applyXpAwards} />

        <QuestPanel
          quests={quests}
          questForm={questForm}
          isQuestModalOpen={isQuestModalOpen}
          isQuestReadOnly={isQuestReadOnly}
          editingQuestId={editingQuestId}
          onCreate={startCreateQuest}
          onView={startViewQuest}
          onEdit={startEditQuest}
          onDelete={handleDeleteQuest}
          onCloseModal={() => setIsQuestModalOpen(false)}
          onSave={handleSaveQuest}
          setQuestForm={setQuestForm}
        />

        <DiceRollerPanel />

        <CombatTrackerPanel
          initiativeList={initiativeList}
          currentTurnIndex={currentTurnIndex}
          selectedEncounterId={selectedEncounterId}
          selectedEncounter={selectedEncounter}
          turnMonitor={turnMonitor}
          srdMonsters={srdMonsters}
          conditionOptions={CONDITION_OPTIONS}
          getInitiativeTypeLabel={getInitiativeTypeLabel}
          isEntryDead={isEntryDead}
          openCustomInitiative={openCustomInitiative}
          resetCombat={resetCombat}
          previousTurn={previousTurn}
          nextTurn={nextTurn}
          setSelectedEncounterId={setSelectedEncounterId}
          loadEncounter={loadEncounter}
          openCreateEncounter={openCreateEncounter}
          openUpdateEncounter={openUpdateEncounter}
          removeEncounter={removeEncounter}
          updateInitiativeValue={updateInitiativeValue}
          updateInitiativeCondition={updateInitiativeCondition}
          openHpAdjust={openHpAdjust}
          duplicateInitiativeEntry={duplicateInitiativeEntry}
          removeFromInitiative={removeFromInitiative}
          openMonsterStats={openMonsterStats}
        />

        <CombatModals
          isAddingToInitiative={isAddingToInitiative}
          initiativeTargetEntry={initiativeTargetEntry}
          initiativeInputValue={initiativeInputValue}
          setIsAddingToInitiative={setIsAddingToInitiative}
          setInitiativeInputValue={setInitiativeInputValue}
          addToInitiative={addToInitiative}
          isEncounterSaveOpen={isEncounterSaveOpen}
          encounterSaveMode={encounterSaveMode}
          encounterNameInput={encounterNameInput}
          setIsEncounterSaveOpen={setIsEncounterSaveOpen}
          setEncounterNameInput={setEncounterNameInput}
          saveEncounter={saveEncounter}
          initiativeListLength={initiativeList.length}
          isHpAdjustOpen={isHpAdjustOpen}
          hpAdjustTarget={hpAdjustTarget}
          hpAdjustValue={hpAdjustValue}
          setIsHpAdjustOpen={setIsHpAdjustOpen}
          setHpAdjustValue={setHpAdjustValue}
          applyHpAdjust={applyHpAdjust}
          isCustomInitiativeOpen={isCustomInitiativeOpen}
          customInitiativeForm={customInitiativeForm}
          setIsCustomInitiativeOpen={setIsCustomInitiativeOpen}
          setCustomInitiativeForm={setCustomInitiativeForm}
          addCustomInitiative={addCustomInitiative}
        />

        <MusicPanel
          turnMonitor={turnMonitor}
          setTurnMonitor={setTurnMonitor}
          musicCategories={MUSIC_CATEGORIES}
          dragMusicCategoryId={dragMusicCategoryId}
          setDragMusicCategoryId={setDragMusicCategoryId}
          addTracksToCategory={addTracksToCategory}
          addTracksFromDrop={addTracksFromDrop}
          removeTrack={removeTrack}
          setActiveTrack={setActiveTrack}
          togglePlay={togglePlay}
          stopPlayback={stopPlayback}
        />

        <TurnsPanel
          turnMonitor={turnMonitor}
          turnMonitorStatusLabel={turnMonitorStatusLabel}
          turnMonitorStatus={turnMonitorStatus}
          saveTurnMonitor={saveTurnMonitor}
          setTurnMonitor={setTurnMonitor}
          updateTurnPeriod={updateTurnPeriod}
          updateTurnAction={updateTurnAction}
          updateEncounterTable={updateEncounterTable}
          updateEncounterTable20={updateEncounterTable20}
          fillEncounterTable={fillEncounterTable}
          fillEncounterTable20={fillEncounterTable20}
          updatePvRow={updatePvRow}
          updateMonsterRow={updateMonsterRow}
          updateEffectRow={updateEffectRow}
          setOrderOfMarch={setOrderOfMarch}
          setOrderOfWatch={setOrderOfWatch}
          turnPeriods={TURN_PERIODS}
          turnRows={TURN_ROWS}
          turnColumns={TURN_COLUMNS}
          dungeonActions={DUNGEON_ACTIONS}
          reactionTable={REACTION_TABLE}
          encounterEnvironments={ENCOUNTER_ENVIRONMENTS}
          encounterDifficulties={ENCOUNTER_DIFFICULTIES}
          encounterRolls={ENCOUNTER_ROLLS}
          encounterRolls20={ENCOUNTER_ROLLS_20}
          srdMonsters={srdMonsters}
          openMonsterStats={openMonsterStats}
          openAddToInitiative={openAddToInitiative}
        />

        <MasterNotesPanel
          masterNote={masterNote}
          isOpen={isMasterNoteOpen}
          masterNoteContent={masterNoteContent}
          onOpen={openMasterNote}
          onClose={() => setIsMasterNoteOpen(false)}
          onSave={handleSaveMasterNote}
          setMasterNoteContent={setMasterNoteContent}
        />

        <SessionNotesPanel
          campaignId={campaignId}
          sessions={sessions}
          npcs={npcs}
          players={players}
          quests={quests}
          locations={locations}
          storyEvents={storyEvents}
          onReloadSessions={loadSessions}
        />

        <NextSessionChecklist />
      </section>

      {/* Janelas flutuantes fixadas (persistentes e arrastáveis) */}
      <PinnedMonsterWindows
        pinnedMonsters={pinnedMonsters}
        monsterImageCache={monsterImageCache}
        isMonsterInInitiative={isMonsterInInitiative}
        onAddToInitiative={handlePinnedMonsterAddToInitiative}
        onClose={handlePinnedMonsterClose}
        onStartDrag={handlePinnedMonsterDragStart}
        formatMod={formatMod}
        getAbilityMod={getAbilityMod}
        translateSize={translateSize}
        translateType={translateType}
        translateAlignment={translateAlignment}
        translateSpeed={translateSpeed}
        translateSense={translateSense}
        translateDamageType={translateDamageType}
        translateAbilityName={translateAbilityName}
        translateActionName={translateActionName}
        translateDescription={translateDescription}
      />
    </div>
  )
}

export default CampaignDashboard
