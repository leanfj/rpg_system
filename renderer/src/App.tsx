import { useState } from 'react'
import Sidebar from './components/Sidebar'
import SessionView from './components/SessionView'
import CampaignList from './components/CampaignList'
import RecordedSessions from './components/RecordedSessions'
import CampaignDashboard from './components/CampaignDashboard'
import './styles/App.css'

type View = 'campaigns' | 'dashboard' | 'session' | 'recordings'

function App() {
  const [currentView, setView] = useState<View>('campaigns')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [lastRecordedSessionId, setLastRecordedSessionId] = useState<string | null>(null)

  const handleOpenCampaign = (campaignId: string) => {
    setActiveCampaignId(campaignId)
    setView('dashboard')
  }

  const handleSessionEnd = (sessionId: string | null) => {
    setActiveSessionId(null)
    if (sessionId) {
      setLastRecordedSessionId(sessionId)
      setView('recordings')
    }
  }

  return (
    <div className="app">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setView}
        hasActiveSession={activeSessionId !== null}
        hasActiveCampaign={activeCampaignId !== null}
      />
      
      <main className="main-content">
        {currentView === 'campaigns' && (
          <CampaignList onStartSession={handleOpenCampaign} />
        )}

        {currentView === 'dashboard' && activeCampaignId && (
          <CampaignDashboard
            campaignId={activeCampaignId}
            onStartSession={() => setView('session')}
          />
        )}
        
        {currentView === 'session' && activeCampaignId && (
          <SessionView 
            campaignId={activeCampaignId}
            sessionId={activeSessionId}
            onSessionStart={setActiveSessionId}
            onSessionEnd={handleSessionEnd}
          />
        )}

        {currentView === 'recordings' && (
          <RecordedSessions initialSessionId={lastRecordedSessionId} />
        )}
      </main>
    </div>
  )
}

export default App
