import type { Dispatch, SetStateAction } from 'react'

type InitiativeTargetEntry = {
  name: string
  type: string
}

type HpAdjustTarget = {
  mode: 'sub' | 'add'
  name: string
}

type CustomInitiativeForm = {
  name: string
  initiative: string
  hp: string
  ac: string
  side: 'ally' | 'enemy'
}

type CombatModalsProps = {
  isAddingToInitiative: boolean
  initiativeTargetEntry: InitiativeTargetEntry | null
  initiativeInputValue: string
  setIsAddingToInitiative: Dispatch<SetStateAction<boolean>>
  setInitiativeInputValue: Dispatch<SetStateAction<string>>
  addToInitiative: () => void
  isEncounterSaveOpen: boolean
  encounterSaveMode: 'create' | 'update'
  encounterNameInput: string
  setIsEncounterSaveOpen: Dispatch<SetStateAction<boolean>>
  setEncounterNameInput: Dispatch<SetStateAction<string>>
  saveEncounter: () => void
  initiativeListLength: number
  isHpAdjustOpen: boolean
  hpAdjustTarget: HpAdjustTarget | null
  hpAdjustValue: string
  setIsHpAdjustOpen: Dispatch<SetStateAction<boolean>>
  setHpAdjustValue: Dispatch<SetStateAction<string>>
  applyHpAdjust: () => void
  isCustomInitiativeOpen: boolean
  customInitiativeForm: CustomInitiativeForm
  setIsCustomInitiativeOpen: Dispatch<SetStateAction<boolean>>
  setCustomInitiativeForm: Dispatch<SetStateAction<CustomInitiativeForm>>
  addCustomInitiative: () => void
}

function CombatModals({
  isAddingToInitiative,
  initiativeTargetEntry,
  initiativeInputValue,
  setIsAddingToInitiative,
  setInitiativeInputValue,
  addToInitiative,
  isEncounterSaveOpen,
  encounterSaveMode,
  encounterNameInput,
  setIsEncounterSaveOpen,
  setEncounterNameInput,
  saveEncounter,
  initiativeListLength,
  isHpAdjustOpen,
  hpAdjustTarget,
  hpAdjustValue,
  setIsHpAdjustOpen,
  setHpAdjustValue,
  applyHpAdjust,
  isCustomInitiativeOpen,
  customInitiativeForm,
  setIsCustomInitiativeOpen,
  setCustomInitiativeForm,
  addCustomInitiative
}: CombatModalsProps) {
  return (
    <>
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

      {isEncounterSaveOpen && (
        <div className="modal-overlay" onClick={() => setIsEncounterSaveOpen(false)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{encounterSaveMode === 'create' ? 'Salvar encontro' : 'Atualizar encontro'}</h4>
              <button className="modal-close" onClick={() => setIsEncounterSaveOpen(false)}>
                ✕
              </button>
            </div>
            <div className="initiative-modal-content">
              <label className="field">
                <span>Nome do encontro</span>
                <input
                  type="text"
                  value={encounterNameInput}
                  onChange={(event) => setEncounterNameInput(event.target.value)}
                  placeholder="Ex: Emboscada na ponte"
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveEncounter()
                  }}
                />
              </label>
              <div className="initiative-modal-actions">
                <button className="btn-secondary" onClick={() => setIsEncounterSaveOpen(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={saveEncounter}
                  disabled={encounterNameInput.trim() === '' || initiativeListLength === 0}
                >
                  {encounterSaveMode === 'create' ? 'Salvar' : 'Atualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isHpAdjustOpen && hpAdjustTarget && (
        <div className="modal-overlay" onClick={() => setIsHpAdjustOpen(false)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{hpAdjustTarget.mode === 'sub' ? 'Subtrair PV' : 'Somar PV'}</h4>
              <button className="modal-close" onClick={() => setIsHpAdjustOpen(false)}>
                ✕
              </button>
            </div>
            <div className="initiative-modal-content">
              <p>
                <strong>{hpAdjustTarget.name}</strong>
              </p>
              <label className="field">
                <span>Quantidade</span>
                <input
                  type="number"
                  min={1}
                  value={hpAdjustValue}
                  onChange={(event) => setHpAdjustValue(event.target.value)}
                  placeholder="Ex: 4"
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') applyHpAdjust()
                  }}
                />
              </label>
              <div className="initiative-modal-actions">
                <button className="btn-secondary" onClick={() => setIsHpAdjustOpen(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={applyHpAdjust}
                  disabled={hpAdjustValue === '' || isNaN(parseInt(hpAdjustValue, 10)) || parseInt(hpAdjustValue, 10) <= 0}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCustomInitiativeOpen && (
        <div className="modal-overlay" onClick={() => setIsCustomInitiativeOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Adicionar Criatura ou NPC</h4>
              <button className="modal-close" onClick={() => setIsCustomInitiativeOpen(false)}>
                ✕
              </button>
            </div>
            <div className="initiative-modal-content">
              <label className="field">
                <span>Nome</span>
                <input
                  type="text"
                  value={customInitiativeForm.name}
                  onChange={(event) =>
                    setCustomInitiativeForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Ex: Goblin arqueiro"
                  autoFocus
                />
              </label>
              <label className="field">
                <span>Valor da Iniciativa</span>
                <input
                  type="number"
                  value={customInitiativeForm.initiative}
                  onChange={(event) =>
                    setCustomInitiativeForm((prev) => ({ ...prev, initiative: event.target.value }))
                  }
                  placeholder="Ex: 14"
                />
              </label>
              <label className="field">
                <span>Vida</span>
                <input
                  type="number"
                  min={0}
                  value={customInitiativeForm.hp}
                  onChange={(event) =>
                    setCustomInitiativeForm((prev) => ({ ...prev, hp: event.target.value }))
                  }
                  placeholder="Ex: 22"
                />
              </label>
              <label className="field">
                <span>CA</span>
                <input
                  type="number"
                  min={0}
                  value={customInitiativeForm.ac}
                  onChange={(event) =>
                    setCustomInitiativeForm((prev) => ({ ...prev, ac: event.target.value }))
                  }
                  placeholder="Ex: 13"
                />
              </label>
              <label className="field">
                <span>Lado</span>
                <select
                  value={customInitiativeForm.side}
                  onChange={(event) =>
                    setCustomInitiativeForm((prev) => ({
                      ...prev,
                      side: event.target.value as 'ally' | 'enemy'
                    }))
                  }
                >
                  <option value="ally">Aliado</option>
                  <option value="enemy">Inimigo</option>
                </select>
              </label>
              <div className="initiative-modal-actions">
                <button className="btn-secondary" onClick={() => setIsCustomInitiativeOpen(false)}>
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={addCustomInitiative}
                  disabled={
                    customInitiativeForm.name.trim() === '' ||
                    customInitiativeForm.initiative === '' ||
                    customInitiativeForm.hp === '' ||
                    customInitiativeForm.ac === '' ||
                    isNaN(parseInt(customInitiativeForm.initiative, 10)) ||
                    isNaN(parseInt(customInitiativeForm.hp, 10)) ||
                    isNaN(parseInt(customInitiativeForm.ac, 10))
                  }
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CombatModals
