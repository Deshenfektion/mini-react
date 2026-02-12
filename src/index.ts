export {
  createElement,
  createTextElement,
  isVNode,
  normalizeChildren,
} from './core/element'
export { Fragment } from './core/jsx'
export { createRoot } from './renderer/root'
export type { Root } from './renderer/root'
export { FRAGMENT, TEXT_ELEMENT } from './shared/symbols'
export type {
  ElementChild,
  ElementChildren,
  ElementType,
  FunctionComponent,
  Key,
  Props,
  VNode,
} from './shared/types'
