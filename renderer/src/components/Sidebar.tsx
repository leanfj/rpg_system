import './Sidebar.css'

interface SidebarProps {
  currentView: 'campaigns' | 'dashboard' | 'session' | 'recordings'
  onNavigate: (view: 'campaigns' | 'dashboard' | 'session' | 'recordings') => void
  hasActiveSession: boolean
  hasActiveCampaign: boolean
}

function Sidebar({ currentView, onNavigate, hasActiveSession, hasActiveCampaign }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">⚔️ RPG Support</h1>
      </div>
      
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === 'campaigns' ? 'active' : ''}`}
          onClick={() => onNavigate('campaigns')}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-label">Campanhas</span>
        </button>

        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
          disabled={!hasActiveCampaign}
        >
          <span className="nav-icon">🧭</span>
          <span className="nav-label">Dashboard</span>
        </button>
        
        <button
          className={`nav-item ${currentView === 'session' ? 'active' : ''}`}
          onClick={() => onNavigate('session')}
          disabled={!hasActiveSession && currentView !== 'session'}
        >
          <span className="nav-icon">🎙️</span>
          <span className="nav-label">Sessão Atual</span>
          {hasActiveSession && <span className="recording-indicator" />}
        </button>

        <button
          className={`nav-item ${currentView === 'recordings' ? 'active' : ''}`}
          onClick={() => onNavigate('recordings')}
        >
          <span className="nav-icon">🗂️</span>
          <span className="nav-label">Sessões Gravadas</span>
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <span className="version">v0.1.0</span>
      </div>
    </aside>
  )
}

export default Sidebar
