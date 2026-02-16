type HeroStats = {
  total: number
  totalMinutes: number
  completed: number
  lastSessionDate: Date | null
}

type HeroPanelProps = {
  campaignName?: string
  stats: HeroStats
  formatDate: (value?: Date | null) => string
  onStartSession: () => void
  onReload: () => void
  onOpenDmShield: () => void
}

function HeroPanel({ campaignName, stats, formatDate, onStartSession, onReload, onOpenDmShield }: HeroPanelProps) {
  return (
    <section className="dashboard-hero">
      <div className="hero-content">
        <p className="hero-kicker">Campanha ativa</p>
        <h2>{campaignName || 'Campanha sem nome'}</h2>
            <p className="hero-subtitle">Comece a próxima sessão e acompanhe o progresso da história.</p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={onStartSession}>
                Iniciar sessão
          </button>
          <button className="btn-secondary" onClick={onReload}>
            Atualizar dados
          </button>
          <button className="btn-secondary" onClick={onOpenDmShield}>
            Escudo do mestre
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
  )
}

export default HeroPanel
