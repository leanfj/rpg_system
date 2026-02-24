import { useEffect, useMemo, useState } from 'react'

type GroupInventoryItem = {
  id: string
  name: string
  quantity: number
  description: string
  createdAt: string
  updatedAt: string
}

type GroupInventory = {
  campaignId: string
  gold: number
  silver: number
  copper: number
  notes: string
  items: GroupInventoryItem[]
  updatedAt: string
}

type GroupInventoryPanelProps = {
  campaignId: string
}

const formatTimestamp = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}

function GroupInventoryPanel({ campaignId }: GroupInventoryPanelProps) {
  const [inventory, setInventory] = useState<GroupInventory | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info')
  const [isSavingEconomy, setIsSavingEconomy] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [economyForm, setEconomyForm] = useState({
    gold: 0,
    silver: 0,
    copper: 0,
    notes: ''
  })
  const [itemForm, setItemForm] = useState({
    name: '',
    quantity: 1,
    description: ''
  })

  const lastUpdatedLabel = useMemo(() => {
    if (!inventory) return '-'
    return formatTimestamp(inventory.updatedAt)
  }, [inventory])

  const applyInventoryState = (nextInventory: GroupInventory) => {
    setInventory(nextInventory)
    setEconomyForm({
      gold: nextInventory.gold,
      silver: nextInventory.silver,
      copper: nextInventory.copper,
      notes: nextInventory.notes
    })
  }

  const loadInventory = async () => {
    try {
      const data = await window.electron.groupInventory.getByCampaign(campaignId)
      applyInventoryState(data)
      setStatusTone('info')
      setStatusMessage('Inventário sincronizado.')
    } catch (error) {
      console.error('Erro ao carregar inventário compartilhado:', error)
      setStatusTone('error')
      setStatusMessage('Erro ao carregar inventário.')
    }
  }

  useEffect(() => {
    void loadInventory()

    const unsubscribe = window.electron.groupInventory.onUpdated((updatedCampaignId, nextInventory) => {
      if (updatedCampaignId !== campaignId) return
      applyInventoryState(nextInventory)
      setStatusTone('success')
      setStatusMessage('Atualização em tempo real recebida.')
    })

    return () => {
      unsubscribe()
    }
  }, [campaignId])

  const handleSaveEconomy = async () => {
    setIsSavingEconomy(true)

    try {
      const updated = await window.electron.groupInventory.saveEconomy(campaignId, {
        gold: Math.max(0, Number(economyForm.gold) || 0),
        silver: Math.max(0, Number(economyForm.silver) || 0),
        copper: Math.max(0, Number(economyForm.copper) || 0),
        notes: economyForm.notes
      })
      applyInventoryState(updated)
      setStatusTone('success')
      setStatusMessage('Economia do grupo atualizada.')
    } catch (error) {
      console.error('Erro ao salvar economia compartilhada:', error)
      setStatusTone('error')
      setStatusMessage('Não foi possível salvar a economia.')
    } finally {
      setIsSavingEconomy(false)
    }
  }

  const handleAddItem = async () => {
    const name = itemForm.name.trim()
    if (!name) {
      setStatusTone('error')
      setStatusMessage('Informe o nome do item.')
      return
    }

    setIsSavingItem(true)

    try {
      const updated = await window.electron.groupInventory.addItem(campaignId, {
        name,
        quantity: Math.max(1, Number(itemForm.quantity) || 1),
        description: itemForm.description.trim()
      })
      applyInventoryState(updated)
      setItemForm({ name: '', quantity: 1, description: '' })
      setStatusTone('success')
      setStatusMessage('Item adicionado ao inventário.')
    } catch (error) {
      console.error('Erro ao adicionar item compartilhado:', error)
      setStatusTone('error')
      setStatusMessage('Não foi possível adicionar o item.')
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleAdjustQuantity = async (item: GroupInventoryItem, delta: number) => {
    const nextQuantity = Math.max(1, Number(item.quantity) + delta)

    try {
      const updated = await window.electron.groupInventory.updateItem(campaignId, item.id, {
        name: item.name,
        quantity: nextQuantity,
        description: item.description
      })
      applyInventoryState(updated)
      setStatusTone('success')
      setStatusMessage('Quantidade atualizada.')
    } catch (error) {
      console.error('Erro ao atualizar item compartilhado:', error)
      setStatusTone('error')
      setStatusMessage('Não foi possível atualizar a quantidade.')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updated = await window.electron.groupInventory.deleteItem(campaignId, itemId)
      applyInventoryState(updated)
      setStatusTone('success')
      setStatusMessage('Item removido do inventário.')
    } catch (error) {
      console.error('Erro ao remover item compartilhado:', error)
      setStatusTone('error')
      setStatusMessage('Não foi possível remover o item.')
    }
  }

  return (
    <article className="dashboard-card group-inventory">
      <header>
        <h3>Inventário Compartilhado</h3>
        <span className="text-muted">Atualizado: {lastUpdatedLabel}</span>
      </header>

      <p className={`group-inventory-status ${statusTone}`}>{statusMessage || 'Sincronizando...'}</p>

      <section className="group-inventory-section">
        <h4>Economia do grupo</h4>
        <div className="group-inventory-economy-grid">
          <label className="field">
            <span>Ouro (PO)</span>
            <input
              type="number"
              min={0}
              value={economyForm.gold}
              onChange={(event) =>
                setEconomyForm((prev) => ({
                  ...prev,
                  gold: Math.max(0, Number(event.target.value) || 0)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Prata (PP)</span>
            <input
              type="number"
              min={0}
              value={economyForm.silver}
              onChange={(event) =>
                setEconomyForm((prev) => ({
                  ...prev,
                  silver: Math.max(0, Number(event.target.value) || 0)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Cobre (PC)</span>
            <input
              type="number"
              min={0}
              value={economyForm.copper}
              onChange={(event) =>
                setEconomyForm((prev) => ({
                  ...prev,
                  copper: Math.max(0, Number(event.target.value) || 0)
                }))
              }
            />
          </label>
        </div>

        <label className="field">
          <span>Observações</span>
          <textarea
            rows={3}
            value={economyForm.notes}
            onChange={(event) => setEconomyForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Ex.: dívida com ferreiro de Waterdeep"
          />
        </label>

        <button className="btn-secondary small" onClick={() => void handleSaveEconomy()} disabled={isSavingEconomy}>
          {isSavingEconomy ? 'Salvando...' : 'Salvar economia'}
        </button>
      </section>

      <section className="group-inventory-section">
        <h4>Itens coletados</h4>

        <div className="group-inventory-item-form">
          <label className="field">
            <span>Nome</span>
            <input
              type="text"
              value={itemForm.name}
              onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Poção de Cura"
            />
          </label>
          <label className="field small-number">
            <span>Qtd</span>
            <input
              type="number"
              min={1}
              value={itemForm.quantity}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  quantity: Math.max(1, Number(event.target.value) || 1)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Detalhes</span>
            <input
              type="text"
              value={itemForm.description}
              onChange={(event) => setItemForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Opcional"
            />
          </label>
          <button className="btn-secondary small" onClick={() => void handleAddItem()} disabled={isSavingItem}>
            {isSavingItem ? 'Adicionando...' : 'Adicionar item'}
          </button>
        </div>

        <div className="group-inventory-items">
          {!inventory || inventory.items.length === 0 ? (
            <p className="dashboard-empty">Nenhum item no inventário compartilhado.</p>
          ) : (
            inventory.items.map((item) => (
              <div key={item.id} className="group-inventory-item">
                <div className="group-inventory-item-main">
                  <strong>{item.name}</strong>
                  {item.description && <span>{item.description}</span>}
                </div>
                <div className="group-inventory-item-actions">
                  <button className="btn-secondary small" onClick={() => void handleAdjustQuantity(item, -1)}>
                    -
                  </button>
                  <span className="group-inventory-item-qty">x{item.quantity}</span>
                  <button className="btn-secondary small" onClick={() => void handleAdjustQuantity(item, 1)}>
                    +
                  </button>
                  <button className="btn-secondary small danger" onClick={() => void handleRemoveItem(item.id)}>
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  )
}

export default GroupInventoryPanel
