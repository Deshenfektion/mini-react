import { diffProperties, updateProperty } from '../dom/properties'
import { FRAGMENT, TEXT_ELEMENT } from '../shared/symbols'
import type { Props, VNode } from '../shared/types'
import { renderComponent } from './component'
import { domNodesOf, firstDomOf } from './instance'
import type {
  ComponentInstance,
  FragmentInstance,
  HostInstance,
  Instance,
  TextInstance,
} from './instance'
import { unmountInstance } from './unmount'

export function mountInstance(
  vnode: VNode,
  parentDom: Node,
  anchor: Node | null,
): Instance {
  const { type } = vnode
  if (type === TEXT_ELEMENT) {
    return mountText(vnode, parentDom, anchor)
  }
  if (type === FRAGMENT) {
    return mountFragment(vnode, parentDom, anchor)
  }
  if (typeof type === 'string') {
    return mountHost(vnode, type, parentDom, anchor)
  }
  return mountComponent(vnode, parentDom, anchor)
}

export function patchInstance(
  instance: Instance,
  vnode: VNode,
  parentDom: Node,
  anchor: Node | null,
): Instance {
  if (instance.vnode.type !== vnode.type) {
    return replaceInstance(instance, vnode, parentDom, anchor)
  }
  switch (instance.kind) {
    case 'text':
      return patchText(instance, vnode)
    case 'host':
      return patchHost(instance, vnode)
    case 'fragment':
      return patchFragment(instance, vnode, parentDom, anchor)
    case 'component':
      return patchComponent(instance, vnode, parentDom, anchor)
  }
}

export function rerenderComponent(instance: ComponentInstance): void {
  if (instance.unmounted || !instance.child) {
    return
  }
  const doms = domNodesOf(instance.child)
  const last = doms[doms.length - 1]
  const anchor = last ? last.nextSibling : null
  instance.child = patchInstance(
    instance.child,
    renderComponent(instance),
    instance.parentDom,
    anchor,
  )
}

export function reconcileChildren(
  oldChildren: Instance[],
  vnodes: VNode[],
  parentDom: Node,
  anchor: Node | null,
): Instance[] {
  for (let i = vnodes.length; i < oldChildren.length; i += 1) {
    const extra = oldChildren[i]
    if (extra) {
      unmountInstance(extra, true)
    }
  }
  const result: Instance[] = []
  let runningAnchor = anchor
  for (let i = vnodes.length - 1; i >= 0; i -= 1) {
    const vnode = vnodes[i]
    if (!vnode) {
      continue
    }
    const old = oldChildren[i]
    let next: Instance
    if (old?.vnode.type === vnode.type) {
      next = patchInstance(old, vnode, parentDom, runningAnchor)
    } else {
      const position = old ? (firstDomOf(old) ?? runningAnchor) : runningAnchor
      next = mountInstance(vnode, parentDom, position)
      if (old) {
        unmountInstance(old, true)
      }
    }
    result[i] = next
    runningAnchor = firstDomOf(next) ?? runningAnchor
  }
  return result
}

function mountText(vnode: VNode, parentDom: Node, anchor: Node | null): TextInstance {
  const dom = document.createTextNode(textOf(vnode.props))
  parentDom.insertBefore(dom, anchor)
  return { kind: 'text', vnode, dom }
}

function mountHost(
  vnode: VNode,
  tag: string,
  parentDom: Node,
  anchor: Node | null,
): HostInstance {
  const dom = document.createElement(tag)
  for (const name of Object.keys(vnode.props)) {
    if (name !== 'children') {
      updateProperty(dom, name, undefined, vnode.props[name])
    }
  }
  const children = mountAll(vnode.props.children, dom, null)
  parentDom.insertBefore(dom, anchor)
  return { kind: 'host', vnode, dom, children }
}

function mountFragment(
  vnode: VNode,
  parentDom: Node,
  anchor: Node | null,
): FragmentInstance {
  const children = mountAll(vnode.props.children, parentDom, anchor)
  return { kind: 'fragment', vnode, children }
}

function mountComponent(
  vnode: VNode,
  parentDom: Node,
  anchor: Node | null,
): ComponentInstance {
  const instance: ComponentInstance = {
    kind: 'component',
    vnode,
    parentDom,
    child: null,
    hooks: [],
    flush: () => {
      rerenderComponent(instance)
    },
    unmounted: false,
  }
  instance.child = mountInstance(renderComponent(instance), parentDom, anchor)
  return instance
}

function mountAll(
  vnodes: VNode[] | undefined,
  parentDom: Node,
  anchor: Node | null,
): Instance[] {
  if (!vnodes) {
    return []
  }
  return vnodes.map((vnode) => mountInstance(vnode, parentDom, anchor))
}

function patchText(instance: TextInstance, vnode: VNode): TextInstance {
  const nextText = textOf(vnode.props)
  if (instance.dom.nodeValue !== nextText) {
    instance.dom.nodeValue = nextText
  }
  instance.vnode = vnode
  return instance
}

function patchHost(instance: HostInstance, vnode: VNode): HostInstance {
  diffProperties(instance.dom, instance.vnode.props, vnode.props)
  instance.children = reconcileChildren(
    instance.children,
    vnode.props.children ?? [],
    instance.dom,
    null,
  )
  instance.vnode = vnode
  return instance
}

function patchFragment(
  instance: FragmentInstance,
  vnode: VNode,
  parentDom: Node,
  anchor: Node | null,
): FragmentInstance {
  instance.children = reconcileChildren(
    instance.children,
    vnode.props.children ?? [],
    parentDom,
    anchor,
  )
  instance.vnode = vnode
  return instance
}

function patchComponent(
  instance: ComponentInstance,
  vnode: VNode,
  parentDom: Node,
  anchor: Node | null,
): ComponentInstance {
  instance.vnode = vnode
  instance.parentDom = parentDom
  if (instance.child) {
    instance.child = patchInstance(
      instance.child,
      renderComponent(instance),
      parentDom,
      anchor,
    )
  }
  return instance
}

function replaceInstance(
  instance: Instance,
  vnode: VNode,
  parentDom: Node,
  anchor: Node | null,
): Instance {
  const position = firstDomOf(instance) ?? anchor
  const next = mountInstance(vnode, parentDom, position)
  unmountInstance(instance, true)
  return next
}

function textOf(props: Props): string {
  const value = props.nodeValue
  return typeof value === 'string' ? value : ''
}
