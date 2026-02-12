import { useEffect, useRef, useState } from 'react'
import DiceBox from '@3d-dice/dice-box-threejs'

type DiceButton = {
  id: string
  label: string
  notation: string
}

type DiceResults = {
  total?: number
}

const DICE_BUTTONS: DiceButton[] = [
  { id: 'd4', label: 'd4', notation: '1d4' },
  { id: 'd6', label: 'd6', notation: '1d6' },
  { id: 'd8', label: 'd8', notation: '1d8' },
  { id: 'd10', label: 'd10', notation: '1d10' },
  { id: 'd12', label: 'd12', notation: '1d12' },
  { id: 'd20', label: 'd20', notation: '1d20' },
  { id: 'd100', label: 'd100', notation: '1d100' }
]

const WHITE_DICE_THEME = {
  name: 'white-black',
  foreground: '#111827',
  background: '#f9fafb',
  outline: '#111827',
  texture: 'none'
}

function DiceRoller() {
  const containerIdRef = useRef(`dice-box-${Math.random().toString(36).slice(2)}`)
  const boxRef = useRef<DiceBox | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [result, setResult] = useState<number | null>(null)

  useEffect(() => {
    let isActive = true
    const box = new DiceBox(`#${containerIdRef.current}`, {
      assetPath: './dice-box/',
      sounds: false,
      theme_customColorset: WHITE_DICE_THEME,
      theme_texture: 'none',
      theme_material: 'plastic',
      theme_surface: 'taverntable'
    })

    box.initialize().then(() => {
      if (!isActive) return
      boxRef.current = box
      setIsReady(true)
    })

    return () => {
      isActive = false
      boxRef.current = null
      try {
        box.clearDice()
      } catch {
        // Ignore cleanup errors during unmount.
      }
      const container = document.getElementById(containerIdRef.current)
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [])

  const rollDice = async (notation: string) => {
    const box = boxRef.current
    if (!box) return
    setResult(null)
    const results = await box.roll(notation) as DiceResults
    if (typeof results?.total === 'number') {
      setResult(results.total)
    }
  }

  return (
    <div className="dice-roller">
      <div className="dice-viewport" id={containerIdRef.current} />
      <div className="dice-controls">
        <div className="dice-buttons">
          {DICE_BUTTONS.map((dice) => (
            <button
              key={dice.id}
              className="btn-secondary small"
              onClick={() => rollDice(dice.notation)}
              disabled={!isReady}
            >
              {dice.label}
            </button>
          ))}
        </div>
        <span className="dice-result">Resultado: {result ?? '-'}</span>
      </div>
    </div>
  )
}

export default DiceRoller
