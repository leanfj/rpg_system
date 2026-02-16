type Session = {
  id: string
  startedAt: Date
  endedAt?: Date
}

type TimelinePanelProps = {
  sessions: Session[]
  formatDate: (value?: Date | null) => string
}

function TimelinePanel({ sessions, formatDate }: TimelinePanelProps) {
  return (
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
  )
}

export default TimelinePanel
