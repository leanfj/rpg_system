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

type TurnMonitorData = {
  periods: Record<TurnPeriodId, boolean[]>
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

const TURN_SLOT_COUNT = 6
const PV_ROW_COUNT = 6
const EFFECT_ROW_COUNT = 6
const MONSTER_ROW_COUNT = 6

const TURN_PERIODS = [
  { id: 'manha' as TurnPeriodId, label: 'Período da manhã' },
  { id: 'tarde' as TurnPeriodId, label: 'Período da tarde' },
  { id: 'noite' as TurnPeriodId, label: 'Período da noite' },
  { id: 'madrugada' as TurnPeriodId, label: 'Período da madrugada' }
]

const TURN_SLOTS = Array.from({ length: TURN_SLOT_COUNT }, (_, index) => index + 1)

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

const createDefaultTurnMonitorData = (): TurnMonitorData => ({
  periods: {
    manha: Array(TURN_SLOT_COUNT).fill(false),
    tarde: Array(TURN_SLOT_COUNT).fill(false),
    noite: Array(TURN_SLOT_COUNT).fill(false),
    madrugada: Array(TURN_SLOT_COUNT).fill(false)
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
  effectRows: Array.from({ length: EFFECT_ROW_COUNT }, () => ({ effect: '', duration: '' }))
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
  const periods = TURN_PERIODS.reduce((acc, period) => {
    acc[period.id] = normalizeArray(value.periods?.[period.id], TURN_SLOT_COUNT, false)
    return acc
  }, {} as Record<TurnPeriodId, boolean[]>)

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
    }))
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
  const [turnMonitor, setTurnMonitor] = useState<TurnMonitorData>(() => createDefaultTurnMonitorData())
  const [turnMonitorStatus, setTurnMonitorStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const hasLoadedTurnMonitorRef = useRef(false)

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

  const turnMonitorStatusLabel =
    turnMonitorStatus === 'saving'
      ? 'Salvando...'
      : turnMonitorStatus === 'saved'
        ? 'Salvo'
        : turnMonitorStatus === 'error'
          ? 'Erro ao salvar'
          : ''

  const updateTurnPeriod = (periodId: TurnPeriodId, index: number, value: boolean) => {
    setTurnMonitor((prev) => ({
      ...prev,
      periods: {
        ...prev.periods,
        [periodId]: prev.periods[periodId].map((slot, slotIndex) =>
          slotIndex === index ? value : slot
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
                      <div className="turns-slot-row">
                        {TURN_SLOTS.map((slot, index) => (
                          <label key={slot} className="turns-slot">
                            <input
                              type="checkbox"
                              checked={turnMonitor.periods[period.id][index]}
                              onChange={(event) => updateTurnPeriod(period.id, index, event.target.checked)}
                              aria-label={`${period.label} turno ${slot}`}
                            />
                            <span>{slot}</span>
                          </label>
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
              <div className="turns-section">
                <h4>Controle de PV</h4>
                <div className="turns-table pv">
                  <div className="turns-table-row turns-table-header">
                    <span>Criatura</span>
                    <span>PV máx</span>
                    <span>PV atual</span>
                  </div>
                  {turnMonitor.pvRows.map((row, index) => (
                    <div key={`pv-${index}`} className="turns-table-row">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={row.name}
                        onChange={(event) => updatePvRow(index, 'name', event.target.value)}
                      />
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
                  ))}
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
    </div>
  )
}

export default CampaignDashboard
