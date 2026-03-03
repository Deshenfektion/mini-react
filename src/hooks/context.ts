import type { ComponentInstance } from '../reconciler/instance'
import type { HookSlot } from './slots'

let current: ComponentInstance | null = null
let cursor = 0

export function beginHooks(instance: ComponentInstance): void {
  current = instance
  cursor = 0
}

export function endHooks(): void {
  const instance = current
  current = null
  if (!instance) {
    return
  }
  if (instance.hookCount < 0) {
    instance.hookCount = cursor
  } else if (cursor !== instance.hookCount) {
    throw new Error('Hook order changed between renders')
  }
}

export function activeInstance(): ComponentInstance {
  if (!current) {
    throw new Error('Hooks can only be called while a component is rendering')
  }
  return current
}

export function claimSlot<S extends HookSlot>(create: () => S): S {
  const instance = activeInstance()
  const index = cursor
  cursor += 1
  if (index >= instance.hooks.length) {
    if (instance.hookCount >= 0) {
      throw new Error('Hook order changed between renders')
    }
    const slot = create()
    instance.hooks.push(slot)
    return slot
  }
  return instance.hooks[index] as S
}
