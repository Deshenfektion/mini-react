export type EffectCleanup = () => void

export type EffectCallback = () => EffectCleanup | void

export interface StateSlot {
  kind: 'state'
  value: unknown
  set: (update: unknown) => void
}

export interface EffectSlot {
  kind: 'effect'
  create: EffectCallback
  deps: readonly unknown[] | null
  cleanup: EffectCleanup | null
  dirty: boolean
}

export type HookSlot = StateSlot | EffectSlot
