import { FRAGMENT } from '../shared/symbols'
import type { ElementChildren, ElementType, Key, Props, VNode } from '../shared/types'
import { coerceKey, normalizeChildren } from './element'

export const Fragment = FRAGMENT

export interface JsxProps {
  [prop: string]: unknown
  key?: Key
  children?: ElementChildren
}

export function jsx(type: ElementType, props: JsxProps, key?: Key): VNode {
  const vnodeProps: Props = {}
  for (const name of Object.keys(props)) {
    if (name !== 'key' && name !== 'children') {
      vnodeProps[name] = props[name]
    }
  }
  const normalized = normalizeChildren([props.children])
  if (normalized.length > 0) {
    vnodeProps.children = normalized
  }
  return {
    type,
    props: vnodeProps,
    key: key ?? coerceKey(props.key),
  }
}

export const jsxs = jsx

export function jsxDEV(type: ElementType, props: JsxProps, key?: Key): VNode {
  return jsx(type, props, key)
}
