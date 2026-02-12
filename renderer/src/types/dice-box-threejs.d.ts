declare module '@3d-dice/dice-box-threejs' {
  type DiceBoxOptions = {
    assetPath?: string
    sounds?: boolean
    theme_customColorset?: {
      name?: string
      foreground?: string
      background?: string | string[]
      outline?: string | string[]
      texture?: string | string[]
    }
    theme_texture?: string
    theme_material?: string
    theme_surface?: string
  }

  type DiceRollResult = {
    total?: number
  }

  export default class DiceBox {
    constructor(containerSelector: string, options?: DiceBoxOptions)
    initialize(): Promise<void>
    roll(notation: string): Promise<DiceRollResult>
    clearDice(): void
  }
}
