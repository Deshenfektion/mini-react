import type { FRAGMENT } from './symbols'
import type { ElementChildren, Key, VNode } from './types'

export namespace JSX {
  export type Element = VNode

  export type ElementType = string | typeof FRAGMENT | ((props: never) => VNode | null)

  export interface ElementChildrenAttribute {
    children: unknown
  }

  export interface IntrinsicAttributes {
    key?: Key
  }

  export interface IntrinsicElementAttributes {
    [attr: string]: unknown
    key?: Key
    children?: ElementChildren
  }

  export type IntrinsicElements = Record<string, IntrinsicElementAttributes>
}
