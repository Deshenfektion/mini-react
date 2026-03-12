import { enqueue } from '../scheduler/scheduler'
import type { EffectSlot } from './slots'

const queue = new Set<EffectSlot>()

export function scheduleEffect(slot: EffectSlot): void {
  queue.add(slot)
  enqueue(flushEffects)
}

export function flushEffects(): void {
  for (const slot of queue) {
    queue.delete(slot)
    if (!slot.dirty) {
      continue
    }
    slot.dirty = false
    runCleanup(slot)
    const cleanup = slot.create()
    slot.cleanup = typeof cleanup === 'function' ? cleanup : null
  }
}

export function cancelEffect(slot: EffectSlot): void {
  queue.delete(slot)
  slot.dirty = false
  runCleanup(slot)
}

export function depsChanged(
  prev: readonly unknown[] | null,
  next: readonly unknown[] | null,
): boolean {
  if (prev === null || next === null) {
    return true
  }
  if (prev.length !== next.length) {
    return true
  }
  return prev.some((value, index) => !Object.is(value, next[index]))
}

function runCleanup(slot: EffectSlot): void {
  const { cleanup } = slot
  if (cleanup) {
    slot.cleanup = null
    cleanup()
  }
}
