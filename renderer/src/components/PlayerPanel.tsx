import type { Dispatch, SetStateAction } from 'react'

type ProficiencyLevel = 'none' | 'proficient' | 'expertise'

type AbilityKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma'

type ProficiencyEntry = {
  key: string
  label: string
  proficiency: ProficiencyLevel
  value: number
}

type SessionNote = {
  id: string
  sessionId: string
  phase: string
  content: string
  session?: { id: string; title?: string; startedAt: Date }
}

type PlayerBase = {
  id: string
  name: string
  className: string
  subclass?: string
  level: number
  ancestry: string
  inspiration?: boolean
  hitPoints: number
  currentHitPoints?: number
  tempHitPoints?: number
  armorClass: number
  initiative?: number
  speed?: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  sheetUrl?: string
}

type PlayerForm = {
  name: string
  playerName: string
  className: string
  subclass: string
  level: number
  ancestry: string
  background: string
  alignment: string
  experience: number
  inspiration: boolean
  proficiencyBonus: number
  hitPoints: number
  currentHitPoints: number
  tempHitPoints: number
  hitDice: string
  deathSaves: string
  passivePerception: number
  armorClass: number
  initiative: number
  speed: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  savingThrows: string
  proficiencies: string
  skills: string
  attacks: string
  spells: string
  equipment: string
  features: string
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  notes: string
  sheetUrl: string
}

type AddToInitiativePayload = {
  type: 'player'
  name: string
  sourceId: string
  hp: number
  maxHp: number
  ac: number
}

type PlayerPanelProps<TPlayer extends PlayerBase> = {
  players: TPlayer[]
  playerForm: PlayerForm
  savingThrowEntries: ProficiencyEntry[]
  skillEntries: ProficiencyEntry[]
  computedProficiencyBonus: number
  isEditingPlayer: boolean
  editingPlayerId: string | null
  relatedNotes?: SessionNote[]
  isInInitiative: (type: 'player' | 'monster', sourceId?: string) => boolean
  openAddToInitiative: (payload: AddToInitiativePayload) => void
  startCreatePlayer: () => void
  startEditPlayer: (player: TPlayer) => void
  handleDeletePlayer: (playerId: string) => void
  adjustPlayerHitPoints: (player: TPlayer, delta: number) => void | Promise<void>
  clearPlayerInspiration: (player: TPlayer) => void | Promise<void>
  handleSavePlayer: () => void | Promise<void>
  setIsEditingPlayer: (value: boolean) => void
  setPlayerForm: Dispatch<SetStateAction<PlayerForm>>
  setSavingThrowEntries: Dispatch<SetStateAction<ProficiencyEntry[]>>
  setSkillEntries: Dispatch<SetStateAction<ProficiencyEntry[]>>
  abilityMod: (key: AbilityKey) => number
  formatMod: (value: number) => string
  getAbilityMod: (score: number) => number
  getProficiencyBonusValue: (entry: ProficiencyEntry) => number
  savingThrowAbilityMap: Record<string, AbilityKey>
  skillAbilityMap: Record<string, AbilityKey>
}

const getPhaseLabel = (phase: string) => {
  if (phase === 'before') return 'Antes'
  if (phase === 'during') return 'Durante'
  if (phase === 'after') return 'Pós'
  return phase
}

function PlayerPanel<TPlayer extends PlayerBase>({
  players,
  playerForm,
  savingThrowEntries,
  skillEntries,
  computedProficiencyBonus,
  isEditingPlayer,
  editingPlayerId,
  relatedNotes = [],
  isInInitiative,
  openAddToInitiative,
  startCreatePlayer,
  startEditPlayer,
  handleDeletePlayer,
  adjustPlayerHitPoints,
  clearPlayerInspiration,
  handleSavePlayer,
  setIsEditingPlayer,
  setPlayerForm,
  setSavingThrowEntries,
  setSkillEntries,
  abilityMod,
  formatMod,
  getAbilityMod,
  getProficiencyBonusValue,
  savingThrowAbilityMap,
  skillAbilityMap
}: PlayerPanelProps<TPlayer>) {
  return (
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
                        {tempHp > 0 && <span className="player-hp-temp">(+{tempHp} temp)</span>}
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
                  {player.className} {player.subclass ? `(${player.subclass})` : ''} (Nível {player.level}) -
                  {player.ancestry}
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
                    className={`action-icon-btn initiative ${
                      isInInitiative('player', player.id) ? 'in-combat' : ''
                    }`}
                    onClick={() =>
                      openAddToInitiative({
                        type: 'player',
                        name: player.name,
                        sourceId: player.id,
                        hp: (player.currentHitPoints ?? player.hitPoints) + (player.tempHitPoints ?? 0),
                        maxHp: player.hitPoints + (player.tempHitPoints ?? 0),
                        ac: player.armorClass
                      })
                    }
                    aria-label="Adicionar à iniciativa"
                    title={
                      isInInitiative('player', player.id) ? 'Já está no combate' : 'Adicionar à iniciativa'
                    }
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
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, playerName: event.target.value })
                      }
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
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, level: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Ancestralidade</span>
                    <input
                      type="text"
                      value={playerForm.ancestry}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, ancestry: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Background</span>
                    <input
                      type="text"
                      value={playerForm.background}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, background: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Alinhamento</span>
                    <input
                      type="text"
                      value={playerForm.alignment}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, alignment: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Experiência</span>
                    <input
                      type="number"
                      min={0}
                      value={playerForm.experience}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, experience: Number(event.target.value) })
                      }
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
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, inspiration: event.target.checked })
                      }
                    />
                    Inspiração
                  </label>
                  <label className="field">
                    <span>Bônus de proficiência</span>
                    <input type="number" min={0} value={computedProficiencyBonus} readOnly />
                  </label>
                  <label className="field">
                    <span>Classe de armadura</span>
                    <input
                      type="number"
                      min={0}
                      value={playerForm.armorClass}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, armorClass: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Iniciativa</span>
                    <input
                      type="number"
                      value={playerForm.initiative}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, initiative: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Deslocamento</span>
                    <input
                      type="number"
                      value={playerForm.speed}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, speed: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Percepcao passiva</span>
                    <input
                      type="number"
                      value={playerForm.passivePerception}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, passivePerception: Number(event.target.value) })
                      }
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
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, hitPoints: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>PV atual</span>
                    <input
                      type="number"
                      min={0}
                      value={playerForm.currentHitPoints}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, currentHitPoints: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>PV temporario</span>
                    <input
                      type="number"
                      min={0}
                      value={playerForm.tempHitPoints}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, tempHitPoints: Number(event.target.value) })
                      }
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
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, deathSaves: event.target.value })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="player-form-section">
                <h5>Atributos</h5>
                <div className="player-form-grid stats">
                  <label className="field">
                    <span>
                      FOR <span className="badge">{formatMod(abilityMod('strength'))}</span>
                    </span>
                    <input
                      type="number"
                      value={playerForm.strength}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, strength: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>
                      DES <span className="badge">{formatMod(abilityMod('dexterity'))}</span>
                    </span>
                    <input
                      type="number"
                      value={playerForm.dexterity}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, dexterity: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>
                      CON <span className="badge">{formatMod(abilityMod('constitution'))}</span>
                    </span>
                    <input
                      type="number"
                      value={playerForm.constitution}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, constitution: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>
                      INT <span className="badge">{formatMod(abilityMod('intelligence'))}</span>
                    </span>
                    <input
                      type="number"
                      value={playerForm.intelligence}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, intelligence: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>
                      SAB <span className="badge">{formatMod(abilityMod('wisdom'))}</span>
                    </span>
                    <input
                      type="number"
                      value={playerForm.wisdom}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, wisdom: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>
                      CAR <span className="badge">{formatMod(abilityMod('charisma'))}</span>
                    </span>
                    <input
                      type="number"
                      value={playerForm.charisma}
                      onChange={(event) =>
                        setPlayerForm({ ...playerForm, charisma: Number(event.target.value) })
                      }
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
                    onChange={(event) =>
                      setPlayerForm({ ...playerForm, proficiencies: event.target.value })
                    }
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
                    onChange={(event) =>
                      setPlayerForm({ ...playerForm, personalityTraits: event.target.value })
                    }
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

              {editingPlayerId && relatedNotes.length > 0 && (
                <div className="player-form-section">
                  <h5>Notas de Sessão Relacionadas ({relatedNotes.length})</h5>
                  <div className="related-notes-list">
                    {relatedNotes.map((note) => (
                      <div key={note.id} className="related-note-item">
                        <div className="related-note-header">
                          <span className="related-note-phase">{getPhaseLabel(note.phase)}</span>
                          {note.session && (
                            <span className="related-note-session">
                              {note.session.title ||
                                new Date(note.session.startedAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <div className="related-note-content">{note.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
  )
}

export default PlayerPanel
