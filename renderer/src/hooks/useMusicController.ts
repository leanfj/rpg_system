import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'

type MusicTrack = {
  id: string
  name: string
  path: string
}

type MusicState<TCategoryId extends string> = {
  categories: Record<TCategoryId, MusicTrack[]>
  activeCategoryId: TCategoryId
  activeTrackId: string | null
  isPlaying: boolean
  volume: number
  autoMode: boolean
}

type MusicCategory<TCategoryId extends string> = {
  id: TCategoryId
  label: string
}

type TurnMonitorLike<TCategoryId extends string> = {
  music: MusicState<TCategoryId>
}

type UseMusicControllerOptions<TCategoryId extends string, TTurnMonitor extends TurnMonitorLike<TCategoryId>> = {
  turnMonitor: TTurnMonitor
  setTurnMonitor: Dispatch<SetStateAction<TTurnMonitor>>
  categories: Array<MusicCategory<TCategoryId>>
  keywords: Record<TCategoryId, string[]>
}

export const useMusicController = <
  TCategoryId extends string,
  TTurnMonitor extends TurnMonitorLike<TCategoryId>
>({
  turnMonitor,
  setTurnMonitor,
  categories,
  keywords
}: UseMusicControllerOptions<TCategoryId, TTurnMonitor>) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastAutoSwitchRef = useRef(0)
  const audioSourceRef = useRef<{ trackId: string | null; url: string | null }>({
    trackId: null,
    url: null
  })

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.loop = true
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (audioSourceRef.current.url) {
        URL.revokeObjectURL(audioSourceRef.current.url)
      }
      audioSourceRef.current = { trackId: null, url: null }
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = Math.min(1, Math.max(0, turnMonitor.music.volume))
  }, [turnMonitor.music.volume])

  useEffect(() => {
    if (!audioRef.current) return
    let isActive = true
    const syncPlayback = async () => {
      const audio = audioRef.current
      if (!audio) return
      const categoryTracks = turnMonitor.music.categories[turnMonitor.music.activeCategoryId]
      const activeTrack = categoryTracks.find((track) => track.id === turnMonitor.music.activeTrackId)
      const nextTrack = activeTrack ?? categoryTracks[0]
      if (!nextTrack) {
        audio.pause()
        return
      }

      if (audioSourceRef.current.trackId !== nextTrack.id) {
        try {
          const fileData = await window.electron.media.readAudioFile(nextTrack.path)
          if (!isActive || !audio) return
          const bytes = fileData.data instanceof ArrayBuffer
            ? new Uint8Array(fileData.data)
            : new Uint8Array(fileData.data)
          const blob = new Blob([bytes], { type: fileData.mimeType })
          const url = URL.createObjectURL(blob)
          if (audioSourceRef.current.url) {
            URL.revokeObjectURL(audioSourceRef.current.url)
          }
          audioSourceRef.current = { trackId: nextTrack.id, url }
          audio.src = url
        } catch (error) {
          console.error('Erro ao carregar musica:', error)
          return
        }
      }

      if (turnMonitor.music.isPlaying) {
        audio.play().catch((error) => {
          console.error('Erro ao tocar musica:', error)
        })
      } else {
        audio.pause()
      }
    }

    syncPlayback()
    return () => {
      isActive = false
    }
  }, [
    turnMonitor.music.activeCategoryId,
    turnMonitor.music.activeTrackId,
    turnMonitor.music.categories,
    turnMonitor.music.isPlaying
  ])

  useEffect(() => {
    if (!turnMonitor.music.autoMode) return
    const unsubscribe = window.electron.audio.onTranscript((text) => {
      const normalized = text.toLowerCase()
      const now = Date.now()
      if (now - lastAutoSwitchRef.current < 5000) return
      const matched = categories.find((category) =>
        keywords[category.id].some((keyword) => normalized.includes(keyword))
      )
      if (!matched) return
      const tracks = turnMonitor.music.categories[matched.id]
      if (tracks.length === 0) return
      const nextTrack = tracks[Math.floor(Math.random() * tracks.length)]
      lastAutoSwitchRef.current = now
      setTurnMonitor((prev) => ({
        ...prev,
        music: {
          ...prev.music,
          activeCategoryId: matched.id,
          activeTrackId: nextTrack.id,
          isPlaying: true
        }
      }))
    })
    return unsubscribe
  }, [categories, keywords, setTurnMonitor, turnMonitor.music.autoMode, turnMonitor.music.categories])

  const pickMusicFiles = async (): Promise<string[]> => {
    try {
      const result = await window.electron.media.pickAudioFiles()
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Erro ao selecionar musicas:', error)
      return []
    }
  }

  const appendTracksToCategory = (categoryId: TCategoryId, paths: string[]) => {
    if (paths.length === 0) return
    setTurnMonitor((prev) => {
      const existing = prev.music.categories[categoryId]
      const newTracks = paths.map((path, index) => {
        const fileName = path.split(/[\\/]/).pop() || path
        return {
          id: `${Date.now()}-${categoryId}-${index}`,
          name: fileName,
          path
        }
      })
      const shouldActivate = prev.music.activeTrackId === null && newTracks.length > 0
      return {
        ...prev,
        music: {
          ...prev.music,
          categories: {
            ...prev.music.categories,
            [categoryId]: [...existing, ...newTracks]
          },
          activeCategoryId: shouldActivate ? categoryId : prev.music.activeCategoryId,
          activeTrackId: shouldActivate ? newTracks[0].id : prev.music.activeTrackId
        }
      }
    })
  }

  const addTracksToCategory = async (categoryId: TCategoryId) => {
    const paths = await pickMusicFiles()
    appendTracksToCategory(categoryId, paths)
  }

  const addTracksFromDrop = (categoryId: TCategoryId, files: FileList | File[]) => {
    const paths = Array.from(files)
      .map((file) => (file as File & { path?: string }).path)
      .filter((path): path is string => Boolean(path))
    appendTracksToCategory(categoryId, paths)
  }

  const removeTrack = (categoryId: TCategoryId, trackId: string) => {
    setTurnMonitor((prev) => {
      const nextTracks = prev.music.categories[categoryId].filter((track) => track.id !== trackId)
      const isActive = prev.music.activeTrackId === trackId
      return {
        ...prev,
        music: {
          ...prev.music,
          categories: {
            ...prev.music.categories,
            [categoryId]: nextTracks
          },
          activeTrackId: isActive ? null : prev.music.activeTrackId,
          isPlaying: isActive ? false : prev.music.isPlaying
        }
      }
    })
  }

  const setActiveTrack = (categoryId: TCategoryId, trackId: string) => {
    setTurnMonitor((prev) => {
      const isSameTrack =
        prev.music.activeCategoryId === categoryId &&
        prev.music.activeTrackId === trackId
      return {
        ...prev,
        music: {
          ...prev.music,
          activeCategoryId: categoryId,
          activeTrackId: trackId,
          isPlaying: isSameTrack ? !prev.music.isPlaying : true
        }
      }
    })
  }

  const getFirstAvailableTrack = (music: MusicState<TCategoryId>) => {
    for (const category of categories) {
      const track = music.categories[category.id][0]
      if (track) return { categoryId: category.id, track }
    }
    return null
  }

  const togglePlay = () => {
    setTurnMonitor((prev) => {
      if (prev.music.isPlaying) {
        return {
          ...prev,
          music: {
            ...prev.music,
            isPlaying: false
          }
        }
      }

      const activeTracks = prev.music.categories[prev.music.activeCategoryId]
      const activeTrack = activeTracks.find((track) => track.id === prev.music.activeTrackId)
      if (activeTrack) {
        return {
          ...prev,
          music: {
            ...prev.music,
            isPlaying: true
          }
        }
      }

      const fallback = getFirstAvailableTrack(prev.music)
      if (!fallback) return prev
      return {
        ...prev,
        music: {
          ...prev.music,
          activeCategoryId: fallback.categoryId,
          activeTrackId: fallback.track.id,
          isPlaying: true
        }
      }
    })
  }

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setTurnMonitor((prev) => ({
      ...prev,
      music: {
        ...prev.music,
        isPlaying: false
      }
    }))
  }

  const playCategoryRandom = (categoryId: TCategoryId) => {
    setTurnMonitor((prev) => {
      const tracks = prev.music.categories[categoryId]
      if (tracks.length === 0) return prev
      const nextTrack = tracks[Math.floor(Math.random() * tracks.length)]
      return {
        ...prev,
        music: {
          ...prev.music,
          activeCategoryId: categoryId,
          activeTrackId: nextTrack.id,
          isPlaying: true
        }
      }
    })
  }

  return {
    addTracksToCategory,
    addTracksFromDrop,
    removeTrack,
    setActiveTrack,
    togglePlay,
    stopPlayback,
    playCategoryRandom
  }
}
