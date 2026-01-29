import type { FRAGMENT, TEXT_ELEMENT } from './symbols'

export type Key = string | number

export type FunctionComponent<P extends Props = Props> = (props: P) => VNode | null

export type ElementType =
  | string
  | FunctionComponent<never>
  | typeof FRAGMENT
  | typeof TEXT_ELEMENT

export interface Props {
  [prop: string]: unknown
  children?: VNode[]
}

export interface VNode {
  type: ElementType
  props: Props
  key: Key | null
}

export type ElementChild = VNode | string | number | boolean | null | undefined

export type ElementChildren = ElementChild | readonly ElementChildren[]
