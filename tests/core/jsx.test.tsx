import { describe, expect, it } from 'vitest'
import { jsxDEV } from '../../src/jsx-dev-runtime'
import { jsx, jsxs } from '../../src/jsx-runtime'
import { FRAGMENT, TEXT_ELEMENT } from '../../src/shared/symbols'
import type { ElementChildren, VNode } from '../../src/shared/types'

function childrenOf(vnode: VNode): VNode[] {
  return vnode.props.children ?? []
}

describe('jsx entry points', () => {
  it('wraps a single child into a normalized children array', () => {
    const vnode = jsx('div', { children: 'hi' })
    const children = childrenOf(vnode)
    expect(children).toHaveLength(1)
    expect(children[0]?.type).toBe(TEXT_ELEMENT)
    expect(children[0]?.props.nodeValue).toBe('hi')
  })

  it('omits the children prop when nothing renders', () => {
    const vnode = jsx('div', { children: false })
    expect('children' in vnode.props).toBe(false)
  })

  it('copies remaining props onto the vnode', () => {
    const vnode = jsx('input', { id: 'name', required: true })
    expect(vnode.props).toEqual({ id: 'name', required: true })
  })

  it('stores the key argument on the vnode', () => {
    const vnode = jsx('li', {}, 'k1')
    expect(vnode.key).toBe('k1')
  })

  it('falls back to a key passed through props', () => {
    const vnode = jsx('li', { key: 3, class: 'row' })
    expect(vnode.key).toBe(3)
    expect(vnode.props).toEqual({ class: 'row' })
  })

  it('prefers the key argument over a props key', () => {
    const vnode = jsx('li', { key: 'spread' }, 'arg')
    expect(vnode.key).toBe('arg')
  })

  it('flattens static children arrays via jsxs', () => {
    const a = jsx('a', {})
    const b = jsx('b', {})
    const vnode = jsxs('div', { children: [a, [b, 'txt']] })
    const children = childrenOf(vnode)
    expect(children).toHaveLength(3)
    expect(children[0]).toBe(a)
    expect(children[1]).toBe(b)
    expect(children[2]?.props.nodeValue).toBe('txt')
  })

  it('behaves identically through the dev runtime', () => {
    const vnode = jsxDEV('div', { children: 0 }, 'k')
    expect(vnode.key).toBe('k')
    expect(childrenOf(vnode)[0]?.props.nodeValue).toBe('0')
  })
})

describe('tsx integration', () => {
  it('compiles host elements with attributes and text', () => {
    const vnode = <div id="app">hello</div>
    expect(vnode.type).toBe('div')
    expect(vnode.props.id).toBe('app')
    expect(childrenOf(vnode)[0]?.props.nodeValue).toBe('hello')
  })

  it('compiles fragments', () => {
    const vnode = (
      <>
        <span />
        <b />
      </>
    )
    expect(vnode.type).toBe(FRAGMENT)
    expect(childrenOf(vnode)).toHaveLength(2)
  })

  it('compiles function components with typed props', () => {
    function Greeting(props: { name: string }) {
      return <span>{props.name}</span>
    }
    const vnode = <Greeting name="Ada" />
    expect(vnode.type).toBe(Greeting)
    expect(vnode.props).toEqual({ name: 'Ada' })
  })

  it('extracts keys from tsx attributes', () => {
    const vnode = <li key="a">x</li>
    expect(vnode.key).toBe('a')
    expect('key' in vnode.props).toBe(false)
  })

  it('drops conditional children that render nothing', () => {
    const items: string[] = []
    const vnode = (
      <div>
        {items.length > 0 && <span />}
        ok
      </div>
    )
    const children = childrenOf(vnode)
    expect(children).toHaveLength(1)
    expect(children[0]?.props.nodeValue).toBe('ok')
  })

  it('supports keyed lists from map expressions', () => {
    const items = ['alpha', 'beta']
    const vnode = (
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
    const children = childrenOf(vnode)
    expect(children).toHaveLength(2)
    expect(children.map((child) => child.key)).toEqual(['alpha', 'beta'])
  })

  it('passes normalized children to components', () => {
    function Wrapper(props: { children?: ElementChildren }) {
      return <div>{props.children}</div>
    }
    const vnode = (
      <Wrapper>
        <span />
        text
      </Wrapper>
    )
    expect(vnode.type).toBe(Wrapper)
    const children = childrenOf(vnode)
    expect(children).toHaveLength(2)
    expect(children[0]?.type).toBe('span')
    expect(children[1]?.props.nodeValue).toBe('text')
  })
})
