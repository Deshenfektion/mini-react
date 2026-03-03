export interface StateSlot {
  kind: 'state'
  value: unknown
  set: (update: unknown) => void
}

export type HookSlot = StateSlot
