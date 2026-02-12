declare module '@3d-dice/dice-ui' {
  type AdvancedRollerOptions = {
    target?: string
    onSubmit?: (notation: unknown) => void
    onClear?: () => void
    onReroll?: (rolls: unknown) => void
    onResults?: (results: unknown) => void
  }

  export class AdvancedRoller {
    constructor(options?: AdvancedRollerOptions)
    submitForm(event: Event): void
    clear(): void
    handleResults(results: unknown): void
  }
}
