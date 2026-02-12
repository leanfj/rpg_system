/**
 * Serviço de captura de áudio com WebSocket.
 * 
 * Fluxo:
 * 1. Captura áudio do microfone via MediaRecorder (no renderer)
 * 2. Envia chunks para o main process via IPC
 * 3. Main process encaminha para o serviço Python via WebSocket
 * 4. Recebe transcrições e emite para o renderer
 */

import { BrowserWindow } from 'electron'
import WebSocket from 'ws'
import { db } from './database'

// Configuração
const STT_SERVICE_URL = 'ws://127.0.0.1:8765/transcribe'
const RECONNECT_DELAY = 3000

// Estado do serviço
let wsConnection: WebSocket | null = null
let isRecording = false
let currentSessionId: string | null = null
let mainWindow: BrowserWindow | null = null
let pendingStop = false
let stopTimeout: NodeJS.Timeout | null = null

/**
 * Define a janela principal para enviar eventos
 */
export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window
}

/**
 * Conecta ao serviço de STT via WebSocket
 */
async function connectToSTT(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    console.log('Conectando ao serviço STT...')
    
    const ws = new WebSocket(STT_SERVICE_URL)
    
    ws.on('open', () => {
      console.log('✓ Conectado ao serviço STT')
      
      // Envia configuração inicial
      ws.send(JSON.stringify({
        type: 'config',
        language: 'pt',
        format: 'webm'
      }))
      
      resolve(ws)
    })
    
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString())
        
        if (message.type === 'transcript' && message.text) {
          console.log('Transcrição recebida:', message.text.substring(0, 50) + '...')
          
          // Salva no banco de dados
          if (currentSessionId) {
            await db.transcriptChunk.create({
              data: {
                sessionId: currentSessionId,
                text: message.text,
                timestamp: message.timestamp || Date.now()
              }
            })
          }
          
          // Envia para o renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('audio:transcript', message.text, message.timestamp)
          }

          if (pendingStop && wsConnection) {
            try {
              wsConnection.close()
            } catch (e) {
              // Ignora erros ao fechar
            }
            wsConnection = null
            pendingStop = false
            currentSessionId = null
            if (stopTimeout) {
              clearTimeout(stopTimeout)
              stopTimeout = null
            }
            console.log('✓ Gravação encerrada (transcrição final recebida)')
          }
        }
      } catch (error) {
        console.error('Erro ao processar mensagem do STT:', error)
      }
    })
    
    ws.on('error', (error) => {
      console.error('Erro na conexão WebSocket:', error.message)
      reject(error)
    })
    
    ws.on('close', () => {
      console.log('Conexão WebSocket encerrada')
      wsConnection = null
      
      // Tenta reconectar se ainda estiver gravando
      if (isRecording) {
        console.log(`Tentando reconectar em ${RECONNECT_DELAY / 1000}s...`)
        setTimeout(async () => {
          if (isRecording) {
            try {
              wsConnection = await connectToSTT()
            } catch (e) {
              console.error('Falha na reconexão')
            }
          }
        }, RECONNECT_DELAY)
      }
    })
  })
}

/**
 * Inicia a gravação de áudio
 */
export async function startRecording(sessionId: string): Promise<boolean> {
  if (isRecording) {
    console.warn('Gravação já está em andamento')
    return false
  }
  
  try {
    // Conecta ao serviço STT
    wsConnection = await connectToSTT()
    currentSessionId = sessionId
    isRecording = true
    pendingStop = false

    if (stopTimeout) {
      clearTimeout(stopTimeout)
      stopTimeout = null
    }
    
    console.log(`✓ Gravação iniciada para sessão ${sessionId}`)
    return true
    
  } catch (error) {
    console.error('Erro ao iniciar gravação:', error)
    isRecording = false
    return false
  }
}

/**
 * Para a gravação de áudio
 */
export async function stopRecording(): Promise<void> {
  if (!isRecording) {
    return
  }
  
  console.log('Parando gravação...')
  isRecording = false
  pendingStop = true

  if (stopTimeout) {
    clearTimeout(stopTimeout)
  }

  stopTimeout = setTimeout(() => {
    if (wsConnection) {
      try {
        wsConnection.close()
      } catch (e) {
        // Ignora erros ao fechar
      }
      wsConnection = null
    }
    pendingStop = false
    currentSessionId = null
    console.log('✓ Gravação encerrada (timeout)')
  }, 15000)

  // Envia sinal de fim, mas mantém o socket aberto para receber a transcrição final
  if (wsConnection) {
    try {
      wsConnection.send(JSON.stringify({ type: 'end' }))
    } catch (e) {
      // Ignora erros ao enviar
    }
  }
}

/**
 * Envia chunk de áudio para processamento
 * Chamado pelo renderer via IPC
 */
export function sendAudioChunk(audioData: Buffer): void {
  if (!isRecording || !wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
    return
  }
  
  try {
    wsConnection.send(audioData)
  } catch (error) {
    console.error('Erro ao enviar chunk de áudio:', error)
  }
}

/**
 * Verifica se o serviço STT está disponível
 */
export async function checkSTTHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:8765/health')
    return response.ok
  } catch {
    return false
  }
}

/**
 * Estado atual do serviço
 */
export function getRecordingState(): { isRecording: boolean; sessionId: string | null } {
  return {
    isRecording,
    sessionId: currentSessionId
  }
}
