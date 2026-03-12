import { enqueue } from '../scheduler/scheduler'
import { activeInstance, claimSlot } from './context'
import type { StateSlot } from './slots'

export type StateUpdate<T> = T | ((previous: T) => T)
export type StateSetter<T> = (update: StateUpdate<T>) => void

export function useState<T>(initial: T | (() => T)): [T, StateSetter<T>] {
  const slot = claimSlot<StateSlot>('state', createStateSlot(initial))
  return [slot.value as T, slot.set]
}

function createStateSlot<T>(initial: T | (() => T)): () => StateSlot {
  return () => {
    const instance = activeInstance()
    const slot: StateSlot = {
      kind: 'state',
      value: typeof initial === 'function' ? (initial as () => T)() : initial,
      set: (update: unknown) => {
        const next =
          typeof update === 'function'
            ? (update as (previous: unknown) => unknown)(slot.value)
            : update
        if (Object.is(next, slot.value)) {
          return
        }
        slot.value = next
        if (!instance.unmounted) {
          enqueue(instance.flush)
        }
      },
    }
    return slot
  }
}
