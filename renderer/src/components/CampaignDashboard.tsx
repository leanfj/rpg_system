import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DiceRoller from './DiceRoller'
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

type MusicCategoryId = 'combate' | 'viagem' | 'taverna' | 'suspense' | 'exploracao' | 'cidade'

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
  { id: 'cidade', label: 'Cidade' }
]

const MUSIC_KEYWORDS: Record<MusicCategoryId, string[]> = {
  combate: ['iniciativa', 'combate', 'atacar', 'batalha', 'inimigos'],
  viagem: ['viagem', 'estrada', 'caminho', 'partida', 'rumo'],
  taverna: ['taverna', 'estalagem', 'bebida', 'caneca'],
  suspense: ['suspeito', 'estranho', 'sombras', 'medo', 'cuidado'],
  exploracao: ['explorar', 'exploração', 'caverna', 'ruínas', 'vasculhar'],
  cidade: ['cidade', 'mercado', 'rua', 'guarda', 'praça']
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
    cidade: []
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

  const incomingMusic = value.music ?? {}
  const defaultMusic = defaults.music
  const normalizedMusic: MusicState = {
    categories: {
      combate: incomingMusic.categories?.combate ?? defaultMusic.categories.combate,
      viagem: incomingMusic.categories?.viagem ?? defaultMusic.categories.viagem,
      taverna: incomingMusic.categories?.taverna ?? defaultMusic.categories.taverna,
      suspense: incomingMusic.categories?.suspense ?? defaultMusic.categories.suspense,
      exploracao: incomingMusic.categories?.exploracao ?? defaultMusic.categories.exploracao,
      cidade: incomingMusic.categories?.cidade ?? defaultMusic.categories.cidade
    },
    activeCategoryId: incomingMusic.activeCategoryId ?? defaultMusic.activeCategoryId,
    activeTrackId: incomingMusic.activeTrackId ?? defaultMusic.activeTrackId,
    isPlaying: incomingMusic.isPlaying ?? defaultMusic.isPlaying,
    volume: typeof incomingMusic.volume === 'number' ? incomingMusic.volume : defaultMusic.volume,
    autoMode: typeof incomingMusic.autoMode === 'boolean' ? incomingMusic.autoMode : defaultMusic.autoMode
  }

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

// Interface para tracker de iniciativa/combate
interface InitiativeEntry {
  id: string
  name: string
  type: 'player' | 'monster'
  initiative: number
  hp?: number
  maxHp?: number
  ac?: number
  sourceId?: string // ID do personagem ou índice do monstro
  monsterData?: SRDMonster // Dados do monstro para referência
}

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
  const [turnMonitor, setTurnMonitor] = useState<TurnMonitorData>(() => createDefaultTurnMonitorData())
  const [turnMonitorStatus, setTurnMonitorStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const hasLoadedTurnMonitorRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastAutoSwitchRef = useRef(0)
  const audioSourceRef = useRef<{ trackId: string | null; url: string | null }>({
    trackId: null,
    url: null
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
  
  // Estados para o tracker de iniciativa/combate
  const [initiativeList, setInitiativeList] = useState<InitiativeEntry[]>([])
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0)
  const [isAddingToInitiative, setIsAddingToInitiative] = useState(false)
  const [initiativeInputValue, setInitiativeInputValue] = useState<string>('')
  const [initiativeTargetEntry, setInitiativeTargetEntry] = useState<{
    type: 'player' | 'monster'
    name: string
    sourceId?: string
    monsterData?: SRDMonster
    hp?: number
    maxHp?: number
    ac?: number
  } | null>(null)
  const nextInitiativeId = useRef(1)

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
    loadTurnMonitor()
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

    const handleMouseMove = (e: MouseEvent) => {
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
      console.error('Erro ao carregar sessões:', error)
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
      console.error('Erro ao carregar anotações do mestre:', error)
    }
  }

  const loadTurnMonitor = async () => {
    try {
      const data = await window.electron.turnMonitor.getByCampaign(campaignId)
      const parsed = data?.content ? JSON.parse(data.content) : null
      setTurnMonitor(normalizeTurnMonitorData(parsed))
      setTurnMonitorStatus('idle')
    } catch (error) {
      console.error('Erro ao carregar monitoramento de turnos:', error)
      setTurnMonitor(createDefaultTurnMonitorData())
      setTurnMonitorStatus('error')
    } finally {
      hasLoadedTurnMonitorRef.current = true
    }
  }

  const saveTurnMonitor = useCallback(async (data: TurnMonitorData, showStatus = true) => {
    try {
      if (showStatus) {
        setTurnMonitorStatus('saving')
      }
      await window.electron.turnMonitor.save({
        campaignId,
        content: JSON.stringify(data)
      })
      if (showStatus) {
        setTurnMonitorStatus('saved')
        setTimeout(() => setTurnMonitorStatus('idle'), 1400)
      }
    } catch (error) {
      console.error('Erro ao salvar monitoramento de turnos:', error)
      setTurnMonitorStatus('error')
    }
  }, [campaignId])

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

  // Funções para o tracker de iniciativa/combate
  const openAddToInitiative = (entry: {
    type: 'player' | 'monster'
    name: string
    sourceId?: string
    monsterData?: SRDMonster
    hp?: number
    maxHp?: number
    ac?: number
  }) => {
    setInitiativeTargetEntry(entry)
    setInitiativeInputValue('')
    setIsAddingToInitiative(true)
  }

  const addToInitiative = () => {
    if (!initiativeTargetEntry) return
    const initiativeValue = parseInt(initiativeInputValue, 10)
    if (isNaN(initiativeValue)) return

    const newEntry: InitiativeEntry = {
      id: `initiative-${nextInitiativeId.current++}`,
      name: initiativeTargetEntry.name,
      type: initiativeTargetEntry.type,
      initiative: initiativeValue,
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

  const removeFromInitiative = (entryId: string) => {
    setInitiativeList((prev) => {
      const removedIndex = prev.findIndex((e) => e.id === entryId)
      const newList = prev.filter((e) => e.id !== entryId)
      
      // Ajusta o índice do turno atual se necessário
      if (currentTurnIndex >= newList.length && newList.length > 0) {
        setCurrentTurnIndex(0)
      } else if (removedIndex < currentTurnIndex) {
        setCurrentTurnIndex((prev) => Math.max(0, prev - 1))
      }
      
      return newList
    })
  }

  const nextTurn = () => {
    if (initiativeList.length === 0) return
    setCurrentTurnIndex((prev) => (prev + 1) % initiativeList.length)
  }

  const previousTurn = () => {
    if (initiativeList.length === 0) return
    setCurrentTurnIndex((prev) => (prev - 1 + initiativeList.length) % initiativeList.length)
  }

  const resetCombat = () => {
    if (!confirm('Deseja encerrar o combate e limpar a lista de iniciativa?')) return
    setInitiativeList([])
    setCurrentTurnIndex(0)
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

  const isInInitiative = (type: 'player' | 'monster', sourceId?: string, name?: string) => {
    return initiativeList.some((entry) => {
      if (entry.type !== type) return false
      if (sourceId && entry.sourceId === sourceId) return true
      if (name && entry.name === name) return true
      return false
    })
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
    audioRef.current = new Audio()
    audioRef.current.loop = true
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (audioSourceRef.current.url) {
        URL.revokeObjectURL(audioSourceRef.current.url)
      }
      audioSourceRef.current = { trackId: null, url: null }
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedTurnMonitorRef.current) return
    const timer = setTimeout(() => {
      saveTurnMonitor(turnMonitor, false)
    }, 700)
    return () => clearTimeout(timer)
  }, [saveTurnMonitor, turnMonitor])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = Math.min(1, Math.max(0, turnMonitor.music.volume))
  }, [turnMonitor.music.volume])

  useEffect(() => {
    if (!audioRef.current) return
    let isActive = true
    const syncPlayback = async () => {
      const categoryTracks = turnMonitor.music.categories[turnMonitor.music.activeCategoryId]
      const activeTrack = categoryTracks.find((track) => track.id === turnMonitor.music.activeTrackId)
      const nextTrack = activeTrack ?? categoryTracks[0]
      if (!nextTrack) {
        audioRef.current?.pause()
        return
      }

      if (audioSourceRef.current.trackId !== nextTrack.id) {
        try {
          const fileData = await window.electron.media.readAudioFile(nextTrack.path)
          if (!isActive || !audioRef.current) return
          const bytes = fileData.data instanceof ArrayBuffer
            ? new Uint8Array(fileData.data)
            : new Uint8Array(fileData.data)
          const blob = new Blob([bytes], { type: fileData.mimeType })
          const url = URL.createObjectURL(blob)
          if (audioSourceRef.current.url) {
            URL.revokeObjectURL(audioSourceRef.current.url)
          }
          audioSourceRef.current = { trackId: nextTrack.id, url }
          audioRef.current.src = url
        } catch (error) {
          console.error('Erro ao carregar música:', error)
          return
        }
      }

      if (turnMonitor.music.isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error('Erro ao tocar música:', error)
        })
      } else {
        audioRef.current.pause()
      }
    }

    syncPlayback()
    return () => {
      isActive = false
    }
  }, [
    turnMonitor.music.activeCategoryId,
    turnMonitor.music.activeTrackId,
    turnMonitor.music.categories,
    turnMonitor.music.isPlaying
  ])

  useEffect(() => {
    if (!turnMonitor.music.autoMode) return
    const unsubscribe = window.electron.audio.onTranscript((text) => {
      const normalized = text.toLowerCase()
      const now = Date.now()
      if (now - lastAutoSwitchRef.current < 5000) return
      const matched = MUSIC_CATEGORIES.find((category) =>
        MUSIC_KEYWORDS[category.id].some((keyword) => normalized.includes(keyword))
      )
      if (!matched) return
      const tracks = turnMonitor.music.categories[matched.id]
      if (tracks.length === 0) return
      const nextTrack = tracks[Math.floor(Math.random() * tracks.length)]
      lastAutoSwitchRef.current = now
      setTurnMonitor((prev) => ({
        ...prev,
        music: {
          ...prev.music,
          activeCategoryId: matched.id,
          activeTrackId: nextTrack.id,
          isPlaying: true
        }
      }))
    })
    return unsubscribe
  }, [turnMonitor.music.autoMode, turnMonitor.music.categories])

  const formatDate = (value?: Date | null) => {
    if (!value) return 'Sem sessões'
    return new Date(value).toLocaleDateString('pt-BR')
  }

  const turnMonitorStatusLabel =
    turnMonitorStatus === 'saving'
      ? 'Salvando...'
      : turnMonitorStatus === 'saved'
        ? 'Salvo'
        : turnMonitorStatus === 'error'
          ? 'Erro ao salvar'
          : ''

  const updateTurnPeriod = (periodId: TurnPeriodId, rowIndex: number, columnIndex: number, value: boolean) => {
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

  const fillEncounterTable = () => {
    setTurnMonitor((prev) => {
      const environment = prev.encounterEnvironment
      const difficulty = prev.encounterDifficulty
      const fallback = ENCOUNTER_TABLES.floresta.medium
      const table =
        ENCOUNTER_TABLES[environment]?.[difficulty] ||
        ENCOUNTER_TABLES[environment]?.medium ||
        fallback
      const normalizedTable = Array.from({ length: ENCOUNTER_ROLLS.length }, (_, index) =>
        table[index] ?? ''
      )
      return { ...prev, encounterTable: normalizedTable }
    })
  }

  const getDifficultyLabel = (difficulty: EncounterDifficulty) => {
    return ENCOUNTER_DIFFICULTIES.find((item) => item.id === difficulty)?.label || 'Médio'
  }

  const fillEncounterTable20 = () => {
    setTurnMonitor((prev) => {
      const environment = prev.encounterEnvironment
      const difficulty = prev.encounterDifficulty
      const template = ENCOUNTER_TABLES_20[environment] || ENCOUNTER_TABLES_20.floresta
      const difficultyLabel = getDifficultyLabel(difficulty)
      const normalizedTable = Array.from({ length: ENCOUNTER_ROLLS_20.length }, (_, index) =>
        (template[index] || '')
          .replace('{difficulty}', difficultyLabel)
          .replace('{environment}', environment)
      )
      return { ...prev, encounterTable20: normalizedTable }
    })
  }

  const updatePvRow = (index: number, key: keyof TurnMonitorPVRow, value: string) => {
    setTurnMonitor((prev) => {
      const nextRows = [...prev.pvRows]
      nextRows[index] = { ...nextRows[index], [key]: value }
      return { ...prev, pvRows: nextRows }
    })
  }

  const updateMonsterRow = (index: number, key: keyof TurnMonitorMonsterRow, value: string) => {
    setTurnMonitor((prev) => {
      const nextRows = [...prev.monsterRows]
      nextRows[index] = { ...nextRows[index], [key]: value }
      return { ...prev, monsterRows: nextRows }
    })
  }

  const updateEffectRow = (index: number, key: keyof TurnMonitorEffectRow, value: string) => {
    setTurnMonitor((prev) => {
      const nextRows = [...prev.effectRows]
      nextRows[index] = { ...nextRows[index], [key]: value }
      return { ...prev, effectRows: nextRows }
    })
  }

  const pickMusicFiles = async (): Promise<string[]> => {
    try {
      const result = await window.electron.media.pickAudioFiles()
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Erro ao selecionar músicas:', error)
      return []
    }
  }

  const addTracksToCategory = async (categoryId: MusicCategoryId) => {
    const paths = await pickMusicFiles()
    if (paths.length === 0) return
    setTurnMonitor((prev) => {
      const existing = prev.music.categories[categoryId]
      const newTracks = paths.map((path, index) => {
        const fileName = path.split(/[\\/]/).pop() || path
        return {
          id: `${Date.now()}-${categoryId}-${index}`,
          name: fileName,
          path
        }
      })
      const shouldActivate = prev.music.activeTrackId === null && newTracks.length > 0
      return {
        ...prev,
        music: {
          ...prev.music,
          categories: {
            ...prev.music.categories,
            [categoryId]: [...existing, ...newTracks]
          },
          activeCategoryId: shouldActivate ? categoryId : prev.music.activeCategoryId,
          activeTrackId: shouldActivate ? newTracks[0].id : prev.music.activeTrackId
        }
      }
    })
  }

  const removeTrack = (categoryId: MusicCategoryId, trackId: string) => {
    setTurnMonitor((prev) => {
      const nextTracks = prev.music.categories[categoryId].filter((track) => track.id !== trackId)
      const isActive = prev.music.activeTrackId === trackId
      return {
        ...prev,
        music: {
          ...prev.music,
          categories: {
            ...prev.music.categories,
            [categoryId]: nextTracks
          },
          activeTrackId: isActive ? null : prev.music.activeTrackId,
          isPlaying: isActive ? false : prev.music.isPlaying
        }
      }
    })
  }

  const setActiveTrack = (categoryId: MusicCategoryId, trackId: string) => {
    setTurnMonitor((prev) => ({
      ...prev,
      music: {
        ...prev.music,
        activeCategoryId: categoryId,
        activeTrackId: trackId,
        isPlaying: true
      }
    }))
  }

  const getFirstAvailableTrack = (music: MusicState) => {
    for (const category of MUSIC_CATEGORIES) {
      const track = music.categories[category.id][0]
      if (track) return { categoryId: category.id, track }
    }
    return null
  }

  const togglePlay = () => {
    setTurnMonitor((prev) => {
      if (prev.music.isPlaying) {
        return {
          ...prev,
          music: {
            ...prev.music,
            isPlaying: false
          }
        }
      }

      const activeTracks = prev.music.categories[prev.music.activeCategoryId]
      const activeTrack = activeTracks.find((track) => track.id === prev.music.activeTrackId)
      if (activeTrack) {
        return {
          ...prev,
          music: {
            ...prev.music,
            isPlaying: true
          }
        }
      }

      const fallback = getFirstAvailableTrack(prev.music)
      if (!fallback) return prev
      return {
        ...prev,
        music: {
          ...prev.music,
          activeCategoryId: fallback.categoryId,
          activeTrackId: fallback.track.id,
          isPlaying: true
        }
      }
    })
  }

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setTurnMonitor((prev) => ({
      ...prev,
      music: {
        ...prev.music,
        isPlaying: false
      }
    }))
  }

  return (
    <div className="campaign-dashboard">
      <section className="dashboard-hero">
        <div className="hero-content">
          <p className="hero-kicker">Campanha ativa</p>
          <h2>{campaign?.name || 'Campanha sem nome'}</h2>
          <p className="hero-subtitle">
            Comece a próxima sessão e acompanhe o progresso da história.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={onStartSession}>
              Iniciar sessão
            </button>
            <button className="btn-secondary" onClick={loadSessions}>
              Atualizar dados
            </button>
          </div>
        </div>
        <div className="hero-panel">
          <div className="stat-card">
            <span className="stat-label">Sessões gravadas</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tempo total</span>
            <span className="stat-value">{stats.totalMinutes} min</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Última sessão</span>
            <span className="stat-value">{formatDate(stats.lastSessionDate)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Sessões concluídas</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card timeline">
          <header>
            <h3>Linha do tempo</h3>
          </header>
          <div className="timeline-list">
            {sessions.length === 0 ? (
              <div className="dashboard-empty">Nenhuma sessão registrada.</div>
            ) : (
              sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div>
                    <strong>{formatDate(new Date(session.startedAt))}</strong>
                    <p className="text-muted">
                      {session.endedAt ? 'Sessão encerrada' : 'Sessão em andamento'}
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
                      <span>{npc.race || 'Raça desconhecida'}</span>
                      <span>{npc.occupation || 'Ocupação indefinida'}</span>
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
                            title="Remover inspiração"
                            aria-label="Remover inspiração"
                          >
                            Inspiração
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
                      {player.className} {player.subclass ? `(${player.subclass})` : ''} (Nível {player.level}) - {player.ancestry}
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
                    {player.sheetUrl && (
                      <button
                        className="action-icon-btn sheet"
                        onClick={() => window.electron.shell.openExternal(player.sheetUrl!)}
                        aria-label="Ver ficha"
                        title="Abrir ficha no navegador"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </button>
                    )}
                    <button
                      className={`action-icon-btn initiative ${isInInitiative('player', player.id) ? 'in-combat' : ''}`}
                      onClick={() => openAddToInitiative({
                        type: 'player',
                        name: player.name,
                        sourceId: player.id,
                        hp: player.currentHitPoints ?? player.hitPoints,
                        maxHp: player.hitPoints,
                        ac: player.armorClass
                      })}
                      aria-label="Adicionar à iniciativa"
                      title={isInInitiative('player', player.id) ? 'Já está no combate' : 'Adicionar à iniciativa'}
                      disabled={isInInitiative('player', player.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                        <path d="M13 19l6-6 2 2-6 6-2-2z" />
                        <path d="M19 13l2-2-6-6-2 2" />
                      </svg>
                    </button>
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
                    <h5>Dados básicos</h5>
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
                        <span>Nível</span>
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
                        <span>Experiência</span>
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
                        Inspiração
                      </label>
                      <label className="field">
                        <span>Bônus de proficiência</span>
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
                    <h5>Perícias e salvaguardas</h5>
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
                                title="Bônus de proficiência"
                              />
                              <input
                                className="proficiency-value"
                                type="text"
                                value={formatMod(abilityMod(savingThrowAbilityMap[entry.key]))}
                                readOnly
                                title="Bônus de atributo"
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
                        <span className="proficiency-title">Perícias</span>
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
                                title="Bônus de proficiência"
                              />
                              <input
                                className="proficiency-value"
                                type="text"
                                value={formatMod(abilityMod(skillAbilityMap[entry.key]))}
                                readOnly
                                title="Bônus de atributo"
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
                      <span>Ataques e conjuração</span>
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
                      <span>Características e talentos</span>
                      <textarea
                        value={playerForm.features}
                        onChange={(event) => setPlayerForm({ ...playerForm, features: event.target.value })}
                      />
                    </label>
                  </div>

                  <div className="player-form-section">
                    <h5>Personalidade</h5>
                    <label className="field">
                      <span>Traços de personalidade</span>
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
                      <span>Vínculos</span>
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
                    <h5>Anotações gerais</h5>
                    <label className="field">
                      <span>Link da ficha</span>
                      <input
                        type="url"
                        placeholder="https://ddb.ac/characters/..."
                        value={playerForm.sheetUrl}
                        onChange={(event) => setPlayerForm({ ...playerForm, sheetUrl: event.target.value })}
                      />
                    </label>
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
                      <span>Observações</span>
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

        <article className="dashboard-card dice">
          <header>
            <h3>Rolador de dados</h3>
          </header>
          <DiceRoller />
        </article>

        {/* Tracker de Combate/Iniciativa */}
        <article className="dashboard-card combat-tracker">
          <header>
            <h3>Tracker de Combate</h3>
            <div className="combat-tracker-header-actions">
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
                Use os botões de espada nos cards de personagens ou monstros para adicionar participantes ao combate.
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
              
              <div className="combat-tracker-list">
                {initiativeList.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`combat-tracker-entry ${index === currentTurnIndex ? 'active' : ''} ${entry.type}`}
                  >
                    <div className="combat-tracker-entry-initiative">
                      <span className="initiative-value">{entry.initiative}</span>
                    </div>
                    <div className="combat-tracker-entry-info">
                      <div className="combat-tracker-entry-name">
                        {entry.name}
                        <span className={`combat-tracker-entry-type ${entry.type}`}>
                          {entry.type === 'player' ? 'Jogador' : 'Criatura'}
                        </span>
                      </div>
                      {(entry.hp !== undefined && entry.maxHp !== undefined) && (
                        <div className="combat-tracker-entry-stats">
                          <div className="combat-tracker-hp">
                            <span>PV: {entry.hp}/{entry.maxHp}</span>
                            <div className="combat-tracker-hp-controls">
                              <button
                                className="combat-hp-btn"
                                onClick={() => updateInitiativeHp(entry.id, -1)}
                                aria-label="Reduzir PV"
                              >
                                -
                              </button>
                              <button
                                className="combat-hp-btn"
                                onClick={() => updateInitiativeHp(entry.id, 1)}
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
                    </div>
                    <div className="combat-tracker-entry-actions">
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
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Modal para adicionar à iniciativa */}
        {isAddingToInitiative && initiativeTargetEntry && (
          <div className="modal-overlay" onClick={() => setIsAddingToInitiative(false)}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h4>Adicionar à Iniciativa</h4>
                <button className="modal-close" onClick={() => setIsAddingToInitiative(false)}>
                  ✕
                </button>
              </div>
              <div className="initiative-modal-content">
                <p>
                  <strong>{initiativeTargetEntry.name}</strong>
                  <span className={`combat-tracker-entry-type ${initiativeTargetEntry.type}`}>
                    {initiativeTargetEntry.type === 'player' ? 'Jogador' : 'Criatura'}
                  </span>
                </p>
                <label className="field">
                  <span>Valor da Iniciativa</span>
                  <input
                    type="number"
                    value={initiativeInputValue}
                    onChange={(e) => setInitiativeInputValue(e.target.value)}
                    placeholder="Ex: 15"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addToInitiative()
                    }}
                  />
                </label>
                <div className="initiative-modal-actions">
                  <button className="btn-secondary" onClick={() => setIsAddingToInitiative(false)}>
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={addToInitiative}
                    disabled={initiativeInputValue === '' || isNaN(parseInt(initiativeInputValue, 10))}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <article className="dashboard-card music">
          <header>
            <h3>Ambiência sonora</h3>
          </header>
          <div className="music-controls">
            <div className="music-controls-main">
              <button className="btn-secondary small" onClick={togglePlay}>
                {turnMonitor.music.isPlaying ? 'Pausar' : 'Tocar'}
              </button>
              <button className="btn-secondary small" onClick={stopPlayback}>
                Parar
              </button>
              <div className="music-volume">
                <span>Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={turnMonitor.music.volume}
                  onChange={(event) =>
                    setTurnMonitor((prev) => ({
                      ...prev,
                      music: {
                        ...prev.music,
                        volume: Number(event.target.value)
                      }
                    }))
                  }
                />
              </div>
            </div>
            <label className="music-auto">
              <input
                type="checkbox"
                checked={turnMonitor.music.autoMode}
                onChange={(event) =>
                  setTurnMonitor((prev) => ({
                    ...prev,
                    music: {
                      ...prev.music,
                      autoMode: event.target.checked
                    }
                  }))
                }
              />
              <span>Trocar por voz (ex: "rola a iniciativa")</span>
            </label>
          </div>
          <div className="music-grid">
            {MUSIC_CATEGORIES.map((category) => {
              const tracks = turnMonitor.music.categories[category.id]
              return (
                <div
                  key={category.id}
                  className={`music-card ${turnMonitor.music.activeCategoryId === category.id ? 'active' : ''}`}
                >
                  <div className="music-card-header">
                    <h4>{category.label}</h4>
                    <button className="btn-secondary small" onClick={() => addTracksToCategory(category.id)}>
                      Adicionar
                    </button>
                  </div>
                  <div className="music-track-list">
                    {tracks.length === 0 ? (
                      <p className="text-muted">Nenhuma música adicionada.</p>
                    ) : (
                      tracks.map((track) => (
                        <div key={track.id} className="music-track">
                          <button
                            className={`music-track-button ${turnMonitor.music.activeTrackId === track.id ? 'active' : ''}`}
                            onClick={() => setActiveTrack(category.id, track.id)}
                          >
                            {track.name}
                          </button>
                          <button
                            className="music-track-remove"
                            onClick={() => removeTrack(category.id, track.id)}
                            aria-label="Remover música"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </article>

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
                  {TURN_PERIODS.map((period) => (
                    <div key={period.id} className="turns-period">
                      <span>{period.label}</span>
                      <div className="turns-slot-grid">
                        <div className="turns-slot-row turns-slot-header-row">
                          <span className="turns-slot-index" aria-hidden="true" />
                          {TURN_COLUMNS.map((column) => (
                            <span key={`${period.id}-head-${column}`} className="turns-slot-head" aria-hidden="true">
                              {column}
                            </span>
                          ))}
                        </div>
                        {TURN_ROWS.map((row, rowIndex) => (
                          <div key={`${period.id}-row-${row}`} className="turns-slot-row">
                            <span className="turns-slot-index">{row}</span>
                            {TURN_COLUMNS.map((column, columnIndex) => (
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
                  onChange={(event) =>
                    setTurnMonitor((prev) => ({ ...prev, orderOfMarch: event.target.value }))
                  }
                />
              </div>

              <div className="turns-section">
                <h4>Ordem de vigília</h4>
                <textarea
                  className="turns-textarea"
                  placeholder="Anote as guardas da noite"
                  rows={6}
                  value={turnMonitor.orderOfWatch}
                  onChange={(event) =>
                    setTurnMonitor((prev) => ({ ...prev, orderOfWatch: event.target.value }))
                  }
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
                  {DUNGEON_ACTIONS.map((action, index) => (
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
                  {REACTION_TABLE.map((row) => (
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
                    <span>CA</span>
                    <span>PV máx</span>
                    <span>PV atual</span>
                  </div>
                  {turnMonitor.pvRows.map((row, index) => {
                    const selectedMonster = srdMonsters.find((m) => m.name === row.name)
                    return (
                      <div key={`pv-${index}`} className="turns-table-row pv-row">
                        <div 
                          className="pv-creature-select-wrapper"
                          onMouseEnter={(e) => {
                            if (selectedMonster) {
                              const newPopup = {
                                id: nextMonsterPopupId.current++,
                                monster: selectedMonster,
                                position: { x: e.clientX + 15, y: e.clientY + 15 }
                              }
                              setPinnedMonsters(prev => [...prev, newPopup])
                            }
                          }}
                        >
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
                            encounterEnvironment: event.target.value as EncounterEnvironment
                          }))
                        }
                      >
                        {ENCOUNTER_ENVIRONMENTS.map((environment) => (
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
                            encounterDifficulty: event.target.value as EncounterDifficulty
                          }))
                        }
                      >
                        {ENCOUNTER_DIFFICULTIES.map((difficulty) => (
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
                  {ENCOUNTER_ROLLS.map((roll, index) => (
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
                  {ENCOUNTER_ROLLS_20.map((roll, index) => (
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

        <article className="dashboard-card notes">
          <header>
            <h3>Anotações do mestre</h3>
          </header>
          <div className="note-box">
            {masterNote?.content ? (
              <pre className="master-note-preview">{masterNote.content}</pre>
            ) : (
              <p className="text-muted">Nenhuma anotação salva.</p>
            )}
          </div>
          <button className="btn-secondary small" onClick={openMasterNote}>
            {masterNote?.content ? 'Editar anotações' : 'Adicionar anotações'}
          </button>

          {isMasterNoteOpen && (
            <div className="modal-overlay" onClick={() => setIsMasterNoteOpen(false)}>
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h4>Anotações do mestre</h4>
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
            <h3>Próxima sessão</h3>
          </header>
          <div className="checklist">
            <label><input type="checkbox" /> Revisar encontros</label>
            <label><input type="checkbox" /> Preparar mapa</label>
            <label><input type="checkbox" /> Atualizar NPCs</label>
            <label><input type="checkbox" /> Separar trilha sonora</label>
          </div>
        </article>
      </section>

      {/* Janelas flutuantes fixadas (persistentes e arrastáveis) */}
      {pinnedMonsters.map((pinned) => (
        <div 
          key={pinned.id}
          className="monster-tooltip monster-tooltip-pinned"
          style={{
            left: pinned.position.x,
            top: pinned.position.y
          }}
        >
          <div 
            className="monster-tooltip-drag-header"
            onMouseDown={(e) => {
              e.preventDefault()
              setDraggingMonsterId(pinned.id)
              setDragOffset({
                x: e.clientX - pinned.position.x,
                y: e.clientY - pinned.position.y
              })
            }}
          >
            <span className="monster-tooltip-drag-title">Estatísticas</span>
            <div className="monster-tooltip-header-actions">
              <button 
                className={`monster-tooltip-initiative ${isInInitiative('monster', undefined, pinned.monster.name) ? 'in-combat' : ''}`}
                onClick={() => openAddToInitiative({
                  type: 'monster',
                  name: pinned.monster.name,
                  monsterData: pinned.monster,
                  hp: pinned.monster.hit_points,
                  maxHp: pinned.monster.hit_points,
                  ac: pinned.monster.armor_class[0]?.value
                })}
                title={isInInitiative('monster', undefined, pinned.monster.name) ? 'Já está no combate' : 'Adicionar à iniciativa'}
                disabled={isInInitiative('monster', undefined, pinned.monster.name)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                  <path d="M13 19l6-6 2 2-6 6-2-2z" />
                  <path d="M19 13l2-2-6-6-2 2" />
                </svg>
              </button>
              <button 
                className="monster-tooltip-close"
                onClick={() => setPinnedMonsters(prev => prev.filter(p => p.id !== pinned.id))}
                title="Fechar"
              >
                &times;
              </button>
            </div>
          </div>
          {pinned.monster.image && monsterImageCache[pinned.monster.image] && (
            <div className="monster-tooltip-image">
              <img 
                src={monsterImageCache[pinned.monster.image]!} 
                alt={pinned.monster.name}
              />
            </div>
          )}
          <div className="monster-tooltip-header">
            <strong>{pinned.monster.name}</strong>
            <span className="monster-cr">CR {pinned.monster.challenge_rating}</span>
          </div>
          <div className="monster-tooltip-meta">
            {translateSize(pinned.monster.size)} {translateType(pinned.monster.type)}, {translateAlignment(pinned.monster.alignment)}
          </div>
          <div className="monster-tooltip-stats">
            <div className="monster-stat-row">
              <span><strong>CA:</strong> {pinned.monster.armor_class[0]?.value}</span>
              <span><strong>PV:</strong> {pinned.monster.hit_points} ({pinned.monster.hit_dice})</span>
            </div>
            <div className="monster-stat-row">
              <span><strong>Deslocamento:</strong> {Object.entries(pinned.monster.speed).map(([k, v]) => `${translateSpeed(k)} ${v}`).join(', ')}</span>
            </div>
          </div>
          <div className="monster-tooltip-abilities">
            <span><strong>FOR:</strong> {pinned.monster.strength}</span>
            <span><strong>DES:</strong> {pinned.monster.dexterity}</span>
            <span><strong>CON:</strong> {pinned.monster.constitution}</span>
            <span><strong>INT:</strong> {pinned.monster.intelligence}</span>
            <span><strong>SAB:</strong> {pinned.monster.wisdom}</span>
            <span><strong>CAR:</strong> {pinned.monster.charisma}</span>
          </div>
          {pinned.monster.damage_immunities.length > 0 && (
            <div className="monster-tooltip-info">
              <strong>Imunidades:</strong> {pinned.monster.damage_immunities.map(translateDamageType).join(', ')}
            </div>
          )}
          {pinned.monster.damage_resistances.length > 0 && (
            <div className="monster-tooltip-info">
              <strong>Resistências:</strong> {pinned.monster.damage_resistances.map(translateDamageType).join(', ')}
            </div>
          )}
          {pinned.monster.damage_vulnerabilities.length > 0 && (
            <div className="monster-tooltip-info">
              <strong>Vulnerabilidades:</strong> {pinned.monster.damage_vulnerabilities.map(translateDamageType).join(', ')}
            </div>
          )}
          {pinned.monster.senses && (
            <div className="monster-tooltip-info">
              <strong>Sentidos:</strong> {Object.entries(pinned.monster.senses).map(([k, v]) => `${translateSense(k)} ${v}`).join(', ')}
            </div>
          )}
          {pinned.monster.languages && (
            <div className="monster-tooltip-info">
              <strong>Idiomas:</strong> {pinned.monster.languages}
            </div>
          )}
          {pinned.monster.special_abilities && pinned.monster.special_abilities.length > 0 && (
            <div className="monster-tooltip-section">
              <strong>Habilidades Especiais:</strong>
              {pinned.monster.special_abilities.slice(0, 3).map((ability, i) => {
                const translatedDesc = translateDescription(ability.desc)
                return (
                  <div key={i} className="monster-ability">
                    <em>{translateAbilityName(ability.name)}:</em> {translatedDesc.substring(0, 150)}{translatedDesc.length > 150 ? '...' : ''}
                  </div>
                )
              })}
            </div>
          )}
          {pinned.monster.actions && pinned.monster.actions.length > 0 && (
            <div className="monster-tooltip-section">
              <strong>Ações:</strong>
              {pinned.monster.actions.slice(0, 3).map((action, i) => {
                const translatedDesc = translateDescription(action.desc)
                return (
                  <div key={i} className="monster-ability">
                    <em>{translateActionName(action.name)}:</em> {translatedDesc.substring(0, 150)}{translatedDesc.length > 150 ? '...' : ''}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default CampaignDashboard
