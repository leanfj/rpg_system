import { useCallback, useEffect, useMemo, useState } from 'react'
import './DmShieldWindow.css'

type DmShieldOption = {
  id: string
  title: string
  content: string
}

const renderMarkdownSection = (content: string) => {
  const lines = content.split(/\r?\n/)
  const blocks: Array<JSX.Element> = []
  let listItems: string[] = []
  let keyIndex = 0

  const flushList = () => {
    if (listItems.length === 0) return
    const items = listItems
    listItems = []
    blocks.push(
      <ul className="dm-shield-list" key={`list-${keyIndex++}`}>
        {items.map((item, index) => (
          <li key={`item-${keyIndex}-${index}`}>{item}</li>
        ))}
      </ul>
    )
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      blocks.push(<div className="dm-shield-spacer" key={`spacer-${keyIndex++}`} />)
      return
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      blocks.push(
        <h3 className="dm-shield-heading" key={`h3-${keyIndex++}`}>
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      blocks.push(
        <h2 className="dm-shield-subheading" key={`h2-${keyIndex++}`}>
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      )
      return
    }

    if (trimmed.startsWith('# ')) {
      flushList()
      blocks.push(
        <h1 className="dm-shield-title" key={`h1-${keyIndex++}`}>
          {trimmed.replace(/^#\s+/, '')}
        </h1>
      )
      return
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ''))
      return
    }

    flushList()
    blocks.push(
      <p className="dm-shield-paragraph" key={`p-${keyIndex++}`}>
        {trimmed}
      </p>
    )
  })

  flushList()
  return blocks
}

const renderMarkdownCards = (content: string) => {
  const sections = content
    .split(/\n---\n/)
    .map((section) => section.trim())
    .filter(Boolean)

  return sections.map((section, index) => (
    <article className="dm-shield-card" key={`card-${index}`}>
      {renderMarkdownSection(section)}
    </article>
  ))
}

function DmShieldWindow() {
  const [options, setOptions] = useState<DmShieldOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOptions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await window.electron.dmShield.getOptions()
      setOptions(result)
      setSelectedId((current) => current ?? result[0]?.id ?? null)
    } catch {
      setError('Nao foi possivel carregar os arquivos do escudo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadState = useCallback(async () => {
    try {
      const state = await window.electron.dmShield.getState()
      setAlwaysOnTop(state.alwaysOnTop)
    } catch {
      // Ignore state failures.
    }
  }, [])

  useEffect(() => {
    void loadOptions()
    void loadState()
  }, [loadOptions, loadState])

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId) ?? options[0],
    [options, selectedId]
  )

  const handleToggleAlwaysOnTop = async (value: boolean) => {
    setAlwaysOnTop(value)
    try {
      await window.electron.dmShield.setAlwaysOnTop(value)
    } catch {
      setAlwaysOnTop((previous) => !previous)
    }
  }

  return (
    <div className="dm-shield-window">
      <header className="dm-shield-header">
        <div>
          <p className="dm-shield-kicker">Ferramenta do mestre</p>
          <h1 className="dm-shield-header-title">Escudo do mestre</h1>
        </div>
        <div className="dm-shield-controls">
          <label className="dm-shield-toggle">
            <input
              type="checkbox"
              checked={alwaysOnTop}
              onChange={(event) => handleToggleAlwaysOnTop(event.target.checked)}
            />
            Sempre no topo
          </label>
          <button className="dm-shield-button" onClick={loadOptions}>
            Recarregar
          </button>
          <button className="dm-shield-button is-ghost" onClick={() => window.electron.dmShield.close()}>
            Fechar
          </button>
        </div>
      </header>

      <section className="dm-shield-toolbar">
        <label className="dm-shield-select-label">
          Conteudo
          <select
            className="dm-shield-select"
            value={selectedOption?.id ?? ''}
            onChange={(event) => setSelectedId(event.target.value)}
            disabled={options.length === 0}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="dm-shield-paper">
        {isLoading && <p className="dm-shield-status">Carregando conteudo...</p>}
        {!isLoading && error && <p className="dm-shield-status is-error">{error}</p>}
        {!isLoading && !error && !selectedOption && (
          <p className="dm-shield-status">Nenhum arquivo encontrado.</p>
        )}
        {!isLoading && !error && selectedOption && (
          <div className="dm-shield-grid">{renderMarkdownCards(selectedOption.content)}</div>
        )}
      </section>
    </div>
  )
}

export default DmShieldWindow
