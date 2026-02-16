import type { Dispatch, SetStateAction } from 'react'

type MusicTrack = {
  id: string
  name: string
  path: string
}

type MusicState<TCategory extends string> = {
  categories: Record<TCategory, MusicTrack[]>
  activeCategoryId: TCategory
  activeTrackId: string | null
  isPlaying: boolean
  volume: number
  autoMode: boolean
}

type TurnMonitorBase<TCategory extends string> = {
  music: MusicState<TCategory>
}

type MusicCategory<TCategory extends string> = {
  id: TCategory
  label: string
}

type MusicPanelProps<TMonitor extends TurnMonitorBase<TCategory>, TCategory extends string> = {
  turnMonitor: TMonitor
  setTurnMonitor: Dispatch<SetStateAction<TMonitor>>
  musicCategories: MusicCategory<TCategory>[]
  dragMusicCategoryId: TCategory | null
  setDragMusicCategoryId: Dispatch<SetStateAction<TCategory | null>>
  addTracksToCategory: (categoryId: TCategory) => void
  addTracksFromDrop: (categoryId: TCategory, files: FileList | File[]) => void
  removeTrack: (categoryId: TCategory, trackId: string) => void
  setActiveTrack: (categoryId: TCategory, trackId: string) => void
  togglePlay: () => void
  stopPlayback: () => void
}

function MusicPanel<TMonitor extends TurnMonitorBase<TCategory>, TCategory extends string>({
  turnMonitor,
  setTurnMonitor,
  musicCategories,
  dragMusicCategoryId,
  setDragMusicCategoryId,
  addTracksToCategory,
  addTracksFromDrop,
  removeTrack,
  setActiveTrack,
  togglePlay,
  stopPlayback
}: MusicPanelProps<TMonitor, TCategory>) {
  return (
    <article className="dashboard-card music">
      <header>
        <h3>Ambiência sonora</h3>
      </header>
      <div className="music-controls">
        <div className="music-controls-main">
          <button className="btn-secondary small" onClick={togglePlay}>
            {turnMonitor.music.isPlaying ? 'Pausar' : 'Tocar'}
          </button>
          <button className="btn-secondary small" onClick={stopPlayback}>
            Parar
          </button>
          <div className="music-volume">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={turnMonitor.music.volume}
              onChange={(event) =>
                setTurnMonitor((prev) => ({
                  ...prev,
                  music: {
                    ...prev.music,
                    volume: Number(event.target.value)
                  }
                }))
              }
            />
          </div>
        </div>
        <label className="music-auto">
          <input
            type="checkbox"
            checked={turnMonitor.music.autoMode}
            onChange={(event) =>
              setTurnMonitor((prev) => ({
                ...prev,
                music: {
                  ...prev.music,
                  autoMode: event.target.checked
                }
              }))
            }
          />
          <span>Trocar por voz (ex: "rola a iniciativa")</span>
        </label>
      </div>
      <div className="music-grid">
        {musicCategories.map((category) => {
          const tracks = turnMonitor.music.categories[category.id]
          return (
            <div
              key={category.id}
              className={`music-card ${turnMonitor.music.activeCategoryId === category.id ? 'active' : ''} ${dragMusicCategoryId === category.id ? 'is-drop-target' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'copy'
                setDragMusicCategoryId(category.id)
              }}
              onDragLeave={() => {
                setDragMusicCategoryId((prev) => (prev === category.id ? null : prev))
              }}
              onDrop={(event) => {
                event.preventDefault()
                setDragMusicCategoryId(null)
                if (event.dataTransfer?.files?.length) {
                  addTracksFromDrop(category.id, event.dataTransfer.files)
                }
              }}
            >
              <div className="music-card-header">
                <h4>{category.label}</h4>
                <button className="btn-secondary small" onClick={() => addTracksToCategory(category.id)}>
                  Adicionar
                </button>
              </div>
              {dragMusicCategoryId === category.id && (
                <div className="music-drop-hint">Solte as musicas aqui</div>
              )}
              <div className="music-track-list">
                {tracks.length === 0 ? (
                  <p className="text-muted">Nenhuma música adicionada.</p>
                ) : (
                  tracks.map((track) => (
                    <div key={track.id} className="music-track">
                      <button
                        className={`music-track-button ${turnMonitor.music.activeTrackId === track.id ? 'active' : ''}`}
                        onClick={() => setActiveTrack(category.id, track.id)}
                      >
                        {track.name}
                      </button>
                      <button
                        className="music-track-remove"
                        onClick={() => removeTrack(category.id, track.id)}
                        aria-label="Remover música"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

export default MusicPanel
