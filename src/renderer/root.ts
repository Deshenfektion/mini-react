import type { Instance } from '../reconciler/instance'
import { mountInstance, patchInstance } from '../reconciler/reconcile'
import { unmountInstance } from '../reconciler/unmount'
import type { VNode } from '../shared/types'

export interface Root {
  render(vnode: VNode): void
  unmount(): void
}

export function createRoot(container: Element): Root {
  let instance: Instance | null = null
  return {
    render(vnode: VNode): void {
      instance = instance
        ? patchInstance(instance, vnode, container, null)
        : mountInstance(vnode, container, null)
    },
    unmount(): void {
      if (instance) {
        unmountInstance(instance, true)
        instance = null
      }
    },
  }
}
