import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAudioRecorderOptions {
  onError?: (error: Error) => void
  chunkIntervalMs?: number
}

interface UseAudioRecorderReturn {
  isRecording: boolean
  isSupported: boolean
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  audioLevel: number
}

/**
 * Hook para captura de áudio do microfone.
 * 
 * Captura áudio, converte para PCM 16-bit mono 16kHz,
 * e envia chunks para o main process via IPC.
 */
export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const { 
    onError, 
    chunkIntervalMs = 2000 // Envia chunk a cada 2 segundos
  } = options

  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSupported] = useState(() => {
    return typeof navigator !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices &&
      'MediaRecorder' in window
  })

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const stopResolveRef = useRef<(() => void) | null>(null)

  const startRecording = useCallback(async () => {
    if (isRecording) return
    if (!isSupported) {
      onError?.(new Error('Captura de áudio não suportada neste navegador'))
      return
    }

    try {
      // Solicita acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      mediaStreamRef.current = stream

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm'
      ]

      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0) return
        chunksRef.current.push(event.data)
      }

      recorder.onstart = () => {
        setIsRecording(true)
        setAudioLevel(0)
        console.log('✓ Captura de áudio iniciada')
      }

      recorder.onstop = async () => {
        setIsRecording(false)
        setAudioLevel(0)

        if (chunksRef.current.length === 0) return

        try {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
          const buffer = await blob.arrayBuffer()
          await window.electron.audio.sendChunk(buffer)
        } catch (error) {
          console.error('Erro ao enviar audio final:', error)
        } finally {
          chunksRef.current = []
          stopResolveRef.current?.()
          stopResolveRef.current = null
        }
      }

      chunksRef.current = []
      mediaRecorderRef.current = recorder
      recorder.start()

    } catch (error) {
      console.error('Erro ao iniciar captura:', error)
      onError?.(error as Error)
    }
  }, [isRecording, isSupported, onError, chunkIntervalMs])

  const stopRecording = useCallback(async () => {
    if (!isRecording) return

    console.log('Parando captura de áudio...')

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        const stopPromise = new Promise<void>((resolve) => {
          stopResolveRef.current = resolve
        })
        mediaRecorderRef.current.stop()
        await stopPromise
      }
      mediaRecorderRef.current = null
    } else {
      setIsRecording(false)
      setAudioLevel(0)
    }

    // Para todas as tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    console.log('✓ Captura de áudio encerrada')
  }, [isRecording])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording()
      }
    }
  }, [isRecording, stopRecording])

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    audioLevel
  }
}
