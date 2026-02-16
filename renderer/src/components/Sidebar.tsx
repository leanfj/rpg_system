import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import './Sidebar.css'

interface SidebarProps {
  currentView: 'campaigns' | 'dashboard' | 'session' | 'recordings'
  onNavigate: (view: 'campaigns' | 'dashboard' | 'session' | 'recordings') => void
  hasActiveSession: boolean
  hasActiveCampaign: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}

function Sidebar({
  currentView,
  onNavigate,
  hasActiveSession,
  hasActiveCampaign,
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-header">
        <h1 className="logo">
          <span className="logo-icon">⚔️</span>
          <span className="logo-text">RPG Support</span>
        </h1>
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
          title={isCollapsed ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === 'campaigns' ? 'active' : ''}`}
          onClick={() => onNavigate('campaigns')}
          data-label="Campanhas"
        >
          <span className="nav-icon">📚</span>
          <span className="nav-label">Campanhas</span>
        </button>

        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
          disabled={!hasActiveCampaign}
          data-label="Dashboard"
        >
          <span className="nav-icon">🧭</span>
          <span className="nav-label">Dashboard</span>
        </button>
        
        <button
          className={`nav-item ${currentView === 'session' ? 'active' : ''}`}
          onClick={() => onNavigate('session')}
          disabled={!hasActiveSession && currentView !== 'session'}
          data-label="Sessão Atual"
        >
          <span className="nav-icon">🎙️</span>
          <span className="nav-label">Sessão Atual</span>
          {hasActiveSession && <span className="recording-indicator" />}
        </button>

        <button
          className={`nav-item ${currentView === 'recordings' ? 'active' : ''}`}
          onClick={() => onNavigate('recordings')}
          data-label="Sessões Gravadas"
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
