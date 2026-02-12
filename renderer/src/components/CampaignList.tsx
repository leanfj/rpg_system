import { useState, useEffect } from 'react'
import './CampaignList.css'

interface Campaign {
  id: string
  name: string
  createdAt: Date
}

interface CampaignListProps {
  onStartSession: (campaignId: string) => void
}

function CampaignList({ onStartSession }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [newCampaignName, setNewCampaignName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const data = await window.electron.campaigns.getAll()
      setCampaigns(data)
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return
    
    try {
      const campaign = await window.electron.campaigns.create(newCampaignName.trim())
      setCampaigns([...campaigns, campaign])
      setNewCampaignName('')
      setIsCreating(false)
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return
    
    try {
      await window.electron.campaigns.delete(id)
      setCampaigns(campaigns.filter(c => c.id !== id))
    } catch (error) {
      console.error('Erro ao excluir campanha:', error)
    }
  }

  return (
    <div className="campaign-list">
      <header className="campaign-header">
        <h2>Campanhas</h2>
        <button 
          className="btn-primary"
          onClick={() => setIsCreating(true)}
        >
          + Nova Campanha
        </button>
      </header>

      {isCreating && (
        <div className="create-campaign-form">
          <input
            type="text"
            placeholder="Nome da campanha..."
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateCampaign()}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setIsCreating(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleCreateCampaign}>
              Criar
            </button>
          </div>
        </div>
      )}

      <div className="campaigns-grid">
        {campaigns.length === 0 && !isCreating ? (
          <div className="empty-state">
            <span className="empty-icon">📜</span>
            <p>Nenhuma campanha criada</p>
            <p className="text-muted">Crie sua primeira campanha para começar a gravar sessões</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-info">
                <h3>{campaign.name}</h3>
                <span className="campaign-date text-muted">
                  Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="campaign-actions">
                <button 
                  className="btn-primary"
                  onClick={() => onStartSession(campaign.id)}
                >
                  Abrir Campanha
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CampaignList
