import { useEffect, useRef, useState } from 'react'
import DiceBox from '@3d-dice/dice-box-threejs'
import { AdvancedRoller } from '@3d-dice/dice-ui'

type DiceButton = {
  id: string
  label: string
  notation: string
}

type DiceResults = {
  total?: number
  sets?: Array<{
    type?: string
    rolls?: Array<{
      value?: number
      label?: string
      type?: string
      sides?: number
    }>
    total?: number
  }>
}

const DICE_BUTTONS: DiceButton[] = [
  { id: 'd4', label: 'd4', notation: '1d4' },
  { id: 'd6', label: 'd6', notation: '1d6' },
  { id: 'd8', label: 'd8', notation: '1d8' },
  { id: 'd10', label: 'd10', notation: '1d10' },
  { id: 'd12', label: 'd12', notation: '1d12' },
  { id: 'd20', label: 'd20', notation: '1d20' },
  { id: '2d20', label: '2d20', notation: '2d20' },
  { id: 'd100', label: 'd100', notation: '1d100+1d10' }
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
  const rollerIdRef = useRef(`dice-roller-${Math.random().toString(36).slice(2)}`)
  const boxRef = useRef<DiceBox | null>(null)
  const rollerRef = useRef<AdvancedRoller | null>(null)
  const diceSoundRef = useRef<HTMLAudioElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [detail, setDetail] = useState<string | null>(null)

  const normalizeNotation = (notation: unknown): string => {
    if (typeof notation === 'string') return notation.trim()
    if (!notation || typeof notation !== 'object') return ''
    if ('notation' in notation) {
      const value = (notation as { notation?: unknown }).notation
      return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
    }
    return ''
  }

  const readNotationFromInput = (): string => {
    const input = document.querySelector<HTMLInputElement>(
      `#${rollerIdRef.current} input`
    )
    return input?.value?.trim() ?? ''
  }

  const getPercentileRoll = (results: DiceResults) => {
    const rolls = results?.sets
      ?.flatMap((set) => set.rolls ?? [])
      .filter((roll) => typeof roll.value === 'number' && typeof roll.sides === 'number')

    if (!rolls || rolls.length === 0) return null

    const d100Roll = rolls.find((roll) => roll.sides === 100)
    const d10Roll = rolls.find((roll) => roll.sides === 10)

    if (!d100Roll || !d10Roll) return null

    const tensValue = (d100Roll.value ?? 0) % 100
    const onesValue = (d10Roll.value ?? 0) % 10
    const combined = tensValue + onesValue
    const percentile = combined === 0 ? 100 : combined
    const detailText = `${String(tensValue).padStart(2, '0')}, ${onesValue}`

    return { value: percentile, detail: detailText }
  }

  const updateResultFromDiceBox = (results: DiceResults, preferD20Detail: boolean) => {
    const total = typeof results?.total === 'number' ? results.total : null
    let detailText: string | null = null
    let fallbackValues: number[] = []

    const percentileRoll = getPercentileRoll(results)
    if (percentileRoll) {
      setDetail(percentileRoll.detail)
      setResult(percentileRoll.value)
      return
    }

    if (preferD20Detail) {
      const d20Set = results?.sets?.find((set) => set.type === 'd20' && (set.rolls?.length ?? 0) >= 2)
      const rolls = d20Set?.rolls
        ?.map((roll) => roll.value)
        .filter((value): value is number => typeof value === 'number')
      if (rolls && rolls.length > 0) {
        detailText = rolls.join(', ')
        fallbackValues = rolls
      }
    }

    setDetail(detailText)

    if (total !== null) {
      setResult(total)
      return
    }

    if (fallbackValues.length > 0) {
      setResult(fallbackValues.reduce((acc, value) => acc + value, 0))
    }
  }

  const playDiceSound = () => {
    const audio = diceSoundRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(() => {
      // Ignore playback errors to keep rolls responsive.
    })
  }

  useEffect(() => {
    const soundUrl = `${import.meta.env.BASE_URL}sounds/dice_roll.mp3`
    const audio = new Audio(soundUrl)
    audio.volume = 0.6
    diceSoundRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
      diceSoundRef.current = null
    }
  }, [])

  useEffect(() => {
    let isActive = true
    const box = new DiceBox(`#${containerIdRef.current}`, {
      assetPath: './dice-box/',
      sounds: false,
      theme_customColorset:{
        background: [
          "#48867a",
          "#ff6600",
          "#1d66af",
          "#7028ed",
          "#b8b831",
          "#d81128"
        ], // randomly assigned colors
        // background: "#00ffcb",
        foreground: "#000000",
        texture: "ice", // marble | ice
        material: "plastic" // metal | glass | plastic | wood
      },
      theme_texture: 'none',
      theme_material: 'plastic',
      theme_surface: 'taverntable',
      light_intensity: 1.1,
      gravity_multiplier: 500,
      baseScale: 115,
      strength: 2,
      delay: 600,
    })

    const roller = new AdvancedRoller({
      target: `#${rollerIdRef.current}`,
      onSubmit: async (notation) => {
        const boxInstance = boxRef.current
        console.log('AdvancedRoller submitted with notation:', notation)
        if (!boxInstance) return
        setResult(null)
        setDetail(null)
        console.log('Current box instance:', boxInstance)
        const parsedNotation = normalizeNotation(notation) || readNotationFromInput()
        console.log('Rolling dice with notation:', parsedNotation)
        if (!parsedNotation) return
        playDiceSound()
        const results = await boxInstance.roll(parsedNotation)
        updateResultFromDiceBox(results, true)
      },
      onClear: () => {
        setResult(null)
        setDetail(null)
        box.clearDice()
      }
    })
    rollerRef.current = roller
    const rollerContainer = document.getElementById(rollerIdRef.current)
    const rollerForm = rollerContainer?.querySelector('.adv-roller--form')
    const existingSubmit = rollerContainer?.querySelector('.adv-roller--submit')
    if (rollerForm && !existingSubmit) {
      const submitButton = document.createElement('button')
      submitButton.type = 'submit'
      submitButton.className = 'adv-roller--submit'
      submitButton.textContent = 'Rolar'
      submitButton.addEventListener('click', (event) => {
        event.preventDefault()
        console.log('Submitting roller form with notation:', rollerForm)
        if (typeof rollerForm.requestSubmit === 'function') {
          rollerForm.requestSubmit()
          return
        }
        rollerForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })
      rollerForm.appendChild(submitButton)
    }

    box.initialize().then(() => {
      if (!isActive) return
      boxRef.current = box
      setIsReady(true)
    })

    return () => {
      isActive = false
      boxRef.current = null
      rollerRef.current = null
      try {
        box.clearDice()
      } catch {
        // Ignore cleanup errors during unmount.
      }
      const container = document.getElementById(containerIdRef.current)
      if (container) {
        container.innerHTML = ''
      }
      const rollerContainer = document.getElementById(rollerIdRef.current)
      if (rollerContainer) {
        rollerContainer.innerHTML = ''
      }
    }
  }, [])

  const rollDice = async (notation: string, diceId: string) => {
    const box = boxRef.current
    if (!box) return
    setResult(null)
    setDetail(null)
    playDiceSound()
    const results = await box.roll(notation) as DiceResults
    updateResultFromDiceBox(results, diceId === '2d20')
  }

  return (
    <div className="dice-roller">
      <div className="dice-viewport" id={containerIdRef.current} />
      <div className="dice-advanced-roller" id={rollerIdRef.current} />
      <div className="dice-controls">
        <div className="dice-buttons">
          {DICE_BUTTONS.map((dice) => (
            <button
              key={dice.id}
              className="btn-secondary small"
              onClick={() => rollDice(dice.notation, dice.id)}
              disabled={!isReady}
            >
              {dice.label}
            </button>
          ))}
        </div>
        <span className="dice-result">
          {result ?? '-'}
          {detail ? ` (${detail})` : ''}
        </span>
      </div>
    </div>
  )
}

export default DiceRoller
