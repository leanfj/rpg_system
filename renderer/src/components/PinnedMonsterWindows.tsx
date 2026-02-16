import type { MouseEvent as ReactMouseEvent } from 'react'

type MonsterBase = {
  name: string
  size: string
  type: string
  alignment: string
  armor_class: Array<{ value: number }>
  hit_points: number
  hit_dice: string
  speed: Record<string, string>
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  damage_immunities: string[]
  damage_resistances: string[]
  damage_vulnerabilities: string[]
  senses: Record<string, string | number>
  languages: string
  challenge_rating: number
  special_abilities?: Array<{ name: string; desc: string }>
  actions?: Array<{ name: string; desc: string }>
  reactions?: Array<{ name: string; desc: string }>
  legendary_actions?: Array<{ name: string; desc: string }>
  image?: string
}

type PinnedMonster<TMonster extends MonsterBase> = {
  id: number
  monster: TMonster
  position: { x: number; y: number }
}

type PinnedMonsterWindowsProps<TMonster extends MonsterBase> = {
  pinnedMonsters: Array<PinnedMonster<TMonster>>
  monsterImageCache: Record<string, string | null>
  isMonsterInInitiative: (name?: string) => boolean
  onAddToInitiative: (monster: TMonster) => void
  onClose: (id: number) => void
  onStartDrag: (id: number, position: { x: number; y: number }, event: ReactMouseEvent<HTMLDivElement>) => void
  formatMod: (value: number) => string
  getAbilityMod: (score: number) => number
  translateSize: (size: string) => string
  translateType: (type: string) => string
  translateAlignment: (alignment: string) => string
  translateSpeed: (key: string) => string
  translateSense: (key: string) => string
  translateDamageType: (damage: string) => string
  translateAbilityName: (name: string) => string
  translateActionName: (name: string) => string
  translateDescription: (description: string) => string
}

function PinnedMonsterWindows<TMonster extends MonsterBase>({
  pinnedMonsters,
  monsterImageCache,
  isMonsterInInitiative,
  onAddToInitiative,
  onClose,
  onStartDrag,
  formatMod,
  getAbilityMod,
  translateSize,
  translateType,
  translateAlignment,
  translateSpeed,
  translateSense,
  translateDamageType,
  translateAbilityName,
  translateActionName,
  translateDescription
}: PinnedMonsterWindowsProps<TMonster>) {
  if (pinnedMonsters.length === 0) return null

  return (
    <>
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
            onMouseDown={(event) => onStartDrag(pinned.id, pinned.position, event)}
          >
            <span className="monster-tooltip-drag-title">Estatísticas</span>
            <div className="monster-tooltip-header-actions">
              <button
                className={`monster-tooltip-initiative ${
                  isMonsterInInitiative(pinned.monster.name) ? 'in-combat' : ''
                }`}
                onClick={() => onAddToInitiative(pinned.monster)}
                title={
                  isMonsterInInitiative(pinned.monster.name)
                    ? 'Adicionar outro à iniciativa'
                    : 'Adicionar à iniciativa'
                }
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                  <path d="M13 19l6-6 2 2-6 6-2-2z" />
                  <path d="M19 13l2-2-6-6-2 2" />
                </svg>
              </button>
              <button
                className="monster-tooltip-close"
                onClick={() => onClose(pinned.id)}
                title="Fechar"
              >
                &times;
              </button>
            </div>
          </div>
          <div className="monster-tooltip-body">
            {pinned.monster.image && monsterImageCache[pinned.monster.image] && (
              <div className="monster-tooltip-image">
                <img src={monsterImageCache[pinned.monster.image]!} alt={pinned.monster.name} />
              </div>
            )}
            <div className="monster-tooltip-header">
              <strong>{pinned.monster.name}</strong>
              <span className="monster-cr">CR {pinned.monster.challenge_rating}</span>
            </div>
            <div className="monster-tooltip-meta">
              {translateSize(pinned.monster.size)} {translateType(pinned.monster.type)},{' '}
              {translateAlignment(pinned.monster.alignment)}
            </div>
            <div className="monster-tooltip-stats">
              <div className="monster-stat-row">
                <span>
                  <strong>CA:</strong> {pinned.monster.armor_class[0]?.value}
                </span>
                <span>
                  <strong>PV:</strong> {pinned.monster.hit_points} ({pinned.monster.hit_dice})
                </span>
              </div>
              <div className="monster-stat-row">
                <span>
                  <strong>Deslocamento:</strong>{' '}
                  {Object.entries(pinned.monster.speed)
                    .map(([key, value]) => `${translateSpeed(key)} ${value}`)
                    .join(', ')}
                </span>
              </div>
            </div>
            <div className="monster-tooltip-abilities">
              <span>
                <strong>FOR:</strong> {pinned.monster.strength}{' '}
                <span className="ability-mod-badge">
                  {formatMod(getAbilityMod(pinned.monster.strength))}
                </span>
              </span>
              <span>
                <strong>DES:</strong> {pinned.monster.dexterity}{' '}
                <span className="ability-mod-badge">
                  {formatMod(getAbilityMod(pinned.monster.dexterity))}
                </span>
              </span>
              <span>
                <strong>CON:</strong> {pinned.monster.constitution}{' '}
                <span className="ability-mod-badge">
                  {formatMod(getAbilityMod(pinned.monster.constitution))}
                </span>
              </span>
              <span>
                <strong>INT:</strong> {pinned.monster.intelligence}{' '}
                <span className="ability-mod-badge">
                  {formatMod(getAbilityMod(pinned.monster.intelligence))}
                </span>
              </span>
              <span>
                <strong>SAB:</strong> {pinned.monster.wisdom}{' '}
                <span className="ability-mod-badge">
                  {formatMod(getAbilityMod(pinned.monster.wisdom))}
                </span>
              </span>
              <span>
                <strong>CAR:</strong> {pinned.monster.charisma}{' '}
                <span className="ability-mod-badge">
                  {formatMod(getAbilityMod(pinned.monster.charisma))}
                </span>
              </span>
            </div>
            {pinned.monster.damage_immunities.length > 0 && (
              <div className="monster-tooltip-info">
                <strong>Imunidades:</strong>{' '}
                {pinned.monster.damage_immunities.map(translateDamageType).join(', ')}
              </div>
            )}
            {pinned.monster.damage_resistances.length > 0 && (
              <div className="monster-tooltip-info">
                <strong>Resistências:</strong>{' '}
                {pinned.monster.damage_resistances.map(translateDamageType).join(', ')}
              </div>
            )}
            {pinned.monster.damage_vulnerabilities.length > 0 && (
              <div className="monster-tooltip-info">
                <strong>Vulnerabilidades:</strong>{' '}
                {pinned.monster.damage_vulnerabilities.map(translateDamageType).join(', ')}
              </div>
            )}
            {pinned.monster.senses && (
              <div className="monster-tooltip-info">
                <strong>Sentidos:</strong>{' '}
                {Object.entries(pinned.monster.senses)
                  .map(([key, value]) => `${translateSense(key)} ${value}`)
                  .join(', ')}
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
                {pinned.monster.special_abilities.map((ability, index) => (
                  <div key={index} className="monster-ability">
                    <em>{translateAbilityName(ability.name)}:</em>{' '}
                    {translateDescription(ability.desc)}
                  </div>
                ))}
              </div>
            )}
            {pinned.monster.actions && pinned.monster.actions.length > 0 && (
              <div className="monster-tooltip-section">
                <strong>Ações:</strong>
                {pinned.monster.actions.map((action, index) => (
                  <div key={index} className="monster-ability">
                    <em>{translateActionName(action.name)}:</em> {translateDescription(action.desc)}
                  </div>
                ))}
              </div>
            )}
            {pinned.monster.reactions && pinned.monster.reactions.length > 0 && (
              <div className="monster-tooltip-section">
                <strong>Reações:</strong>
                {pinned.monster.reactions.map((reaction, index) => (
                  <div key={index} className="monster-ability">
                    <em>{translateActionName(reaction.name)}:</em>{' '}
                    {translateDescription(reaction.desc)}
                  </div>
                ))}
              </div>
            )}
            {pinned.monster.legendary_actions && pinned.monster.legendary_actions.length > 0 && (
              <div className="monster-tooltip-section">
                <strong>Ações Lendárias:</strong>
                {pinned.monster.legendary_actions.map((action, index) => (
                  <div key={index} className="monster-ability">
                    <em>{translateActionName(action.name)}:</em> {translateDescription(action.desc)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  )
}

export default PinnedMonsterWindows
