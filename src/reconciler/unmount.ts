import { cancelEffect } from '../hooks/effects'
import type { Instance } from './instance'

export function unmountInstance(instance: Instance, removeDom: boolean): void {
  switch (instance.kind) {
    case 'text':
      if (removeDom) {
        instance.dom.remove()
      }
      return
    case 'host':
      for (const child of instance.children) {
        unmountInstance(child, false)
      }
      if (removeDom) {
        instance.dom.remove()
      }
      return
    case 'fragment':
      for (const child of instance.children) {
        unmountInstance(child, removeDom)
      }
      return
    case 'component':
      instance.unmounted = true
      for (const slot of instance.hooks) {
        if (slot.kind === 'effect') {
          cancelEffect(slot)
        }
      }
      if (instance.child) {
        unmountInstance(instance.child, removeDom)
      }
      return
  }
}
