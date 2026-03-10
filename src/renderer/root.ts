import { createEventRoot, destroyEventRoot } from '../events/delegation'
import type { Instance } from '../reconciler/instance'
import { mountInstance, patchInstance } from '../reconciler/reconcile'
import { unmountInstance } from '../reconciler/unmount'
import type { VNode } from '../shared/types'

export interface Root {
  render(vnode: VNode): void
  unmount(): void
}

export function createRoot(container: Element): Root {
  const events = createEventRoot(container)
  let instance: Instance | null = null
  return {
    render(vnode: VNode): void {
      instance = instance
        ? patchInstance(instance, vnode, container, null, events)
        : mountInstance(vnode, container, null, events)
    },
    unmount(): void {
      if (instance) {
        unmountInstance(instance, true)
        instance = null
      }
      destroyEventRoot(events)
    },
  }
}
