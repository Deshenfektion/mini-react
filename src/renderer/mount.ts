import { setProperty } from '../dom/properties'
import { FRAGMENT, TEXT_ELEMENT } from '../shared/symbols'
import type { Props, VNode } from '../shared/types'

export function mountVNode(vnode: VNode, parent: Node): void {
  const { type } = vnode
  if (type === TEXT_ELEMENT) {
    parent.appendChild(document.createTextNode(textOf(vnode.props)))
    return
  }
  if (type === FRAGMENT) {
    mountChildren(vnode.props.children, parent)
    return
  }
  if (typeof type === 'string') {
    const dom = document.createElement(type)
    applyProps(dom, vnode.props)
    mountChildren(vnode.props.children, dom)
    parent.appendChild(dom)
    return
  }
  throw new TypeError('Function components are not supported yet')
}

function mountChildren(children: VNode[] | undefined, parent: Node): void {
  if (!children) {
    return
  }
  for (const child of children) {
    mountVNode(child, parent)
  }
}

function applyProps(dom: HTMLElement, props: Props): void {
  for (const name of Object.keys(props)) {
    if (name !== 'children') {
      setProperty(dom, name, props[name])
    }
  }
}

function textOf(props: Props): string {
  const value = props.nodeValue
  return typeof value === 'string' ? value : ''
}
