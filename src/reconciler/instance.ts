import type { EventRoot } from '../events/delegation'
import type { HookSlot } from '../hooks/slots'
import type { VNode } from '../shared/types'

export type Instance = HostInstance | TextInstance | FragmentInstance | ComponentInstance

export interface HostInstance {
  kind: 'host'
  vnode: VNode
  dom: HTMLElement
  children: Instance[]
}

export interface TextInstance {
  kind: 'text'
  vnode: VNode
  dom: Text
}

export interface FragmentInstance {
  kind: 'fragment'
  vnode: VNode
  children: Instance[]
}

export interface ComponentInstance {
  kind: 'component'
  vnode: VNode
  parentDom: Node
  events: EventRoot
  child: Instance | null
  hooks: HookSlot[]
  hookCount: number
  flush: () => void
  unmounted: boolean
}

export function domNodesOf(instance: Instance): Node[] {
  switch (instance.kind) {
    case 'host':
    case 'text':
      return [instance.dom]
    case 'fragment':
      return instance.children.flatMap(domNodesOf)
    case 'component':
      return instance.child ? domNodesOf(instance.child) : []
  }
}

export function firstDomOf(instance: Instance): Node | null {
  return domNodesOf(instance)[0] ?? null
}
