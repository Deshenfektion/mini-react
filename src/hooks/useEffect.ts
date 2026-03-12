import { claimSlot } from './context'
import { depsChanged, scheduleEffect } from './effects'
import type { EffectCallback, EffectSlot } from './slots'

export function useEffect(create: EffectCallback, deps?: readonly unknown[]): void {
  const nextDeps = deps ?? null
  const first = { render: false }
  const slot = claimSlot<EffectSlot>('effect', () => {
    first.render = true
    return { kind: 'effect', create, deps: nextDeps, cleanup: null, dirty: true }
  })
  if (!first.render) {
    slot.create = create
    if (depsChanged(slot.deps, nextDeps)) {
      slot.deps = nextDeps
      slot.dirty = true
    }
  }
  if (slot.dirty) {
    scheduleEffect(slot)
  }
}
