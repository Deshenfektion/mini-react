import type { VNode } from '../shared/types'
import { mountVNode } from './mount'

export interface Root {
  render(vnode: VNode): void
  unmount(): void
}

export function createRoot(container: Element): Root {
  return {
    render(vnode: VNode): void {
      container.textContent = ''
      mountVNode(vnode, container)
    },
    unmount(): void {
      container.textContent = ''
    },
  }
}
