import { createTextElement } from '../core/element'
import { beginHooks, endHooks } from '../hooks/context'
import type { FunctionComponent, VNode } from '../shared/types'
import type { ComponentInstance } from './instance'

export function renderComponent(instance: ComponentInstance): VNode {
  const component = instance.vnode.type as FunctionComponent
  beginHooks(instance)
  try {
    const rendered = component(instance.vnode.props)
    return rendered ?? createTextElement('')
  } finally {
    endHooks()
  }
}
