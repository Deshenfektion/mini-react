import { describe, expect, it } from 'vitest'
import {
  createElement,
  createTextElement,
  isVNode,
  normalizeChildren,
} from '../../src/core/element'
import { TEXT_ELEMENT } from '../../src/shared/symbols'
import type { VNode } from '../../src/shared/types'

function childrenOf(vnode: VNode): VNode[] {
  return vnode.props.children ?? []
}

describe('createElement', () => {
  it('creates a vnode with type and props', () => {
    const vnode = createElement('div', { id: 'app', title: 'hello' })
    expect(vnode.type).toBe('div')
    expect(vnode.props).toEqual({ id: 'app', title: 'hello' })
    expect(vnode.key).toBeNull()
  })

  it('defaults props to an empty object when omitted', () => {
    const vnode = createElement('span')
    expect(vnode.props).toEqual({})
  })

  it('defaults props to an empty object when null', () => {
    const vnode = createElement('span', null)
    expect(vnode.props).toEqual({})
  })

  it('extracts key out of props', () => {
    const vnode = createElement('li', { key: 'item-1', class: 'row' })
    expect(vnode.key).toBe('item-1')
    expect(vnode.props).toEqual({ class: 'row' })
  })

  it('accepts numeric keys', () => {
    const vnode = createElement('li', { key: 0 })
    expect(vnode.key).toBe(0)
  })

  it('ignores keys of invalid types', () => {
    const vnode = createElement('li', { key: { bad: true } })
    expect(vnode.key).toBeNull()
  })

  it('does not attach a children prop when there are no children', () => {
    const vnode = createElement('div', { id: 'x' })
    expect('children' in vnode.props).toBe(false)
  })

  it('nests child elements under props.children', () => {
    const child = createElement('span')
    const parent = createElement('div', null, child)
    expect(parent.props.children).toEqual([child])
  })

  it('preserves child order', () => {
    const a = createElement('a')
    const b = createElement('b')
    const c = createElement('c')
    const parent = createElement('div', null, a, b, c)
    expect(parent.props.children).toEqual([a, b, c])
  })

  it('accepts function components as type', () => {
    const App = () => createElement('div')
    const vnode = createElement(App)
    expect(vnode.type).toBe(App)
  })
})

describe('child normalization', () => {
  it('converts strings to text elements', () => {
    const vnode = createElement('p', null, 'hello')
    const children = childrenOf(vnode)
    expect(children).toHaveLength(1)
    expect(children[0]?.type).toBe(TEXT_ELEMENT)
    expect(children[0]?.props.nodeValue).toBe('hello')
  })

  it('converts numbers to text elements, including zero', () => {
    const vnode = createElement('p', null, 0)
    const children = childrenOf(vnode)
    expect(children[0]?.type).toBe(TEXT_ELEMENT)
    expect(children[0]?.props.nodeValue).toBe('0')
  })

  it('drops null, undefined, true, and false children', () => {
    const vnode = createElement('div', null, null, undefined, true, false)
    expect('children' in vnode.props).toBe(false)
  })

  it('keeps renderable children interleaved with dropped ones', () => {
    const span = createElement('span')
    const vnode = createElement('div', null, false, 'a', null, span, undefined)
    const children = childrenOf(vnode)
    expect(children).toHaveLength(2)
    expect(children[0]?.props.nodeValue).toBe('a')
    expect(children[1]).toBe(span)
  })

  it('flattens nested arrays of children', () => {
    const a = createElement('a')
    const b = createElement('b')
    const c = createElement('c')
    const vnode = createElement('div', null, [a, [b, [c]]])
    expect(vnode.props.children).toEqual([a, b, c])
  })

  it('flattens arrays mixed with scalars', () => {
    const item = createElement('li')
    const vnode = createElement('ul', null, 'start', [item, null, ['end']])
    const children = childrenOf(vnode)
    expect(children).toHaveLength(3)
    expect(children[0]?.props.nodeValue).toBe('start')
    expect(children[1]).toBe(item)
    expect(children[2]?.props.nodeValue).toBe('end')
  })

  it('normalizes standalone child lists', () => {
    const result = normalizeChildren(['x', false, 42])
    expect(result).toHaveLength(2)
    expect(result[0]?.props.nodeValue).toBe('x')
    expect(result[1]?.props.nodeValue).toBe('42')
  })
})

describe('createTextElement', () => {
  it('stores the value as a string nodeValue', () => {
    const vnode = createTextElement(7)
    expect(vnode.type).toBe(TEXT_ELEMENT)
    expect(vnode.props).toEqual({ nodeValue: '7' })
    expect(vnode.key).toBeNull()
  })
})

describe('isVNode', () => {
  it('accepts vnodes', () => {
    expect(isVNode(createElement('div'))).toBe(true)
    expect(isVNode(createTextElement('x'))).toBe(true)
  })

  it('rejects primitives and plain objects', () => {
    expect(isVNode(null)).toBe(false)
    expect(isVNode('div')).toBe(false)
    expect(isVNode(42)).toBe(false)
    expect(isVNode({})).toBe(false)
    expect(isVNode({ type: 'div' })).toBe(false)
  })
})
