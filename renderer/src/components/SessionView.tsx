import { useState, useEffect, useRef } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import './SessionView.css'

interface TranscriptChunk {
  id: string
  text: string
  timestamp: number
}

interface SessionViewProps {
  campaignId: string
  sessionId: string | null
  onSessionStart: (sessionId: string) => void
  onSessionEnd: (sessionId: string | null) => void
}

function SessionView({ campaignId, sessionId, onSessionStart, onSessionEnd }: SessionViewProps) {
  const [transcripts, setTranscripts] = useState<TranscriptChunk[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [sttStatus, setSttStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()
  
  const { 
    isRecording, 
    isSupported, 
    startRecording: startAudioCapture, 
    stopRecording: stopAudioCapture,
    audioLevel 
  } = useAudioRecorder({
    onError: (error) => console.error('Erro na captura de áudio:', error)
  })

  // Auto-scroll quando novas transcrições chegam
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcripts])

  // Verifica status do serviço STT
  useEffect(() => {
    const checkSTT = async () => {
      setSttStatus('checking')
      const isOnline = await window.electron.audio.checkSTT()
      setSttStatus(isOnline ? 'online' : 'offline')
    }
    
    checkSTT()
    const interval = setInterval(checkSTT, 30000) // Verifica a cada 30s
    return () => clearInterval(interval)
  }, [])

  // Timer da sessão
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    
    return () => clearInterval(timerRef.current)
  }, [isRecording])

  // Listener para transcrições em tempo real
  useEffect(() => {
    if (!sessionId) return

    const unsubscribe = window.electron.audio.onTranscript((text, timestamp) => {
      setTranscripts(prev => [...prev, {
        id: `${Date.now()}`,
        text,
        timestamp
      }])
    })

    return unsubscribe
  }, [sessionId])

  const handleStartSession = async () => {
    if (sttStatus !== 'online') {
      alert('O serviço de transcrição não está disponível. Inicie o servidor Python primeiro.')
      return
    }
    
    try {
      const session = await window.electron.sessions.start(campaignId)
      onSessionStart(session.id)
      
      // Inicia gravação no main process (WebSocket)
      await window.electron.audio.startRecording('default', session.id)
      
      // Inicia captura de áudio no renderer (microfone)
      await startAudioCapture()
      
      setElapsedTime(0)
      setTranscripts([])
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error)
    }
  }

  const handleStopSession = async () => {
    try {
      // Para captura de áudio e envia o arquivo final
      await stopAudioCapture()
      
      // Para gravação no main process
      await window.electron.audio.stopRecording()
      
      if (sessionId) {
        await window.electron.sessions.stop(sessionId)
      }
      onSessionEnd(sessionId)
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error)
    }
  }

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="session-view">
      <header className="session-header">
        <div className="session-info">
          <h2>Sessão de RPG</h2>
          <div className="status-row">
            {isRecording && (
              <div className="recording-status">
                <span className="recording-dot" />
                <span>Gravando</span>
                <span className="elapsed-time mono">{formatTime(elapsedTime)}</span>
              </div>
            )}
            <div className={`stt-status stt-${sttStatus}`}>
              <span className="stt-dot" />
              <span>STT: {sttStatus === 'checking' ? 'verificando...' : sttStatus}</span>
            </div>
          </div>
          {isRecording && (
            <div className="audio-level-container">
              <div className="audio-level" style={{ width: `${audioLevel * 100}%` }} />
            </div>
          )}
        </div>
        
        <div className="session-controls">
          {!isRecording ? (
            <button 
              className="btn-record" 
              onClick={handleStartSession}
              disabled={sttStatus !== 'online' || !isSupported}
            >
              <span className="record-icon">⏺</span>
              Iniciar Gravação
            </button>
          ) : (
            <button className="btn-stop" onClick={handleStopSession}>
              <span className="stop-icon">⏹</span>
              Encerrar Sessão
            </button>
          )}
        </div>
      </header>

      <div className="transcript-container">
        {transcripts.length === 0 ? (
          <div className="transcript-empty">
            {isRecording ? (
              <>
                <span className="listening-icon">👂</span>
                <p>Ouvindo...</p>
                <p className="text-muted">As transcrições aparecerão aqui em tempo real</p>
              </>
            ) : (
              <>
                <span className="waiting-icon">🎙️</span>
                <p>Pronto para gravar</p>
                <p className="text-muted">Clique em "Iniciar Gravação" para começar a sessão</p>
              </>
            )}
          </div>
        ) : (
          <div className="transcript-list">
            {transcripts.map((chunk) => (
              <div key={chunk.id} className="transcript-item">
                <span className="transcript-timestamp mono">
                  [{formatTimestamp(chunk.timestamp)}]
                </span>
                <p className="transcript-text">{chunk.text}</p>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionView
