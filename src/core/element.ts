import { TEXT_ELEMENT } from '../shared/symbols'
import type { ElementChildren, ElementType, Key, Props, VNode } from '../shared/types'

export function createElement(
  type: ElementType,
  props?: Props | null,
  ...children: readonly ElementChildren[]
): VNode {
  const { key = null, ...rest } = props ?? {}
  const normalized = normalizeChildren(children)
  if (normalized.length > 0) {
    rest.children = normalized
  }
  return {
    type,
    props: rest,
    key: isValidKey(key) ? key : null,
  }
}

export function createTextElement(value: string | number): VNode {
  return {
    type: TEXT_ELEMENT,
    props: { nodeValue: String(value) },
    key: null,
  }
}

export function normalizeChildren(children: readonly ElementChildren[]): VNode[] {
  const result: VNode[] = []
  appendChildren(result, children)
  return result
}

function appendChildren(target: VNode[], children: readonly ElementChildren[]): void {
  for (const child of children) {
    if (Array.isArray(child)) {
      appendChildren(target, child)
    } else if (typeof child === 'string' || typeof child === 'number') {
      target.push(createTextElement(child))
    } else if (isRenderableNode(child)) {
      target.push(child)
    }
  }
}

export function isVNode(value: unknown): value is VNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'props' in value &&
    'key' in value
  )
}

function isRenderableNode(child: ElementChildren): child is VNode {
  return child !== null && child !== undefined && typeof child !== 'boolean'
}

function isValidKey(value: unknown): value is Key {
  return typeof value === 'string' || typeof value === 'number'
}
