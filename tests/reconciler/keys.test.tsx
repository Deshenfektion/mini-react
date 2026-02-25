import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from '../../src/renderer/root'
import type { Root } from '../../src/renderer/root'

let container: HTMLElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.replaceChildren(container)
  root = createRoot(container)
})

function renderList(items: string[]): void {
  root.render(
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>,
  )
}

function elementsByText(): Map<string, Element> {
  const map = new Map<string, Element>()
  for (const li of container.querySelectorAll('li')) {
    map.set(li.textContent, li)
  }
  return map
}

function texts(): string[] {
  return [...container.querySelectorAll('li')].map((li) => li.textContent)
}

describe('keyed reconciliation', () => {
  it('reuses dom nodes when order is unchanged', () => {
    renderList(['a', 'b'])
    const before = elementsByText()
    renderList(['a', 'b'])
    const after = elementsByText()
    expect(after.get('a')).toBe(before.get('a'))
    expect(after.get('b')).toBe(before.get('b'))
  })

  it('moves dom nodes instead of recreating them on reorder', () => {
    renderList(['a', 'b', 'c'])
    const before = elementsByText()
    renderList(['c', 'a', 'b'])
    expect(texts()).toEqual(['c', 'a', 'b'])
    const after = elementsByText()
    expect(after.get('a')).toBe(before.get('a'))
    expect(after.get('b')).toBe(before.get('b'))
    expect(after.get('c')).toBe(before.get('c'))
  })

  it('survives a full reversal', () => {
    renderList(['a', 'b', 'c', 'd'])
    const before = elementsByText()
    renderList(['d', 'c', 'b', 'a'])
    expect(texts()).toEqual(['d', 'c', 'b', 'a'])
    const after = elementsByText()
    for (const item of ['a', 'b', 'c', 'd']) {
      expect(after.get(item)).toBe(before.get(item))
    }
  })

  it('inserts into the middle without touching neighbors', () => {
    renderList(['a', 'c'])
    const before = elementsByText()
    renderList(['a', 'b', 'c'])
    expect(texts()).toEqual(['a', 'b', 'c'])
    const after = elementsByText()
    expect(after.get('a')).toBe(before.get('a'))
    expect(after.get('c')).toBe(before.get('c'))
  })

  it('removes from the middle without touching neighbors', () => {
    renderList(['a', 'b', 'c'])
    const before = elementsByText()
    renderList(['a', 'c'])
    expect(texts()).toEqual(['a', 'c'])
    const after = elementsByText()
    expect(after.get('a')).toBe(before.get('a'))
    expect(after.get('c')).toBe(before.get('c'))
  })

  it('handles simultaneous add, remove, and move', () => {
    renderList(['a', 'b', 'c', 'd'])
    const before = elementsByText()
    renderList(['d', 'e', 'b'])
    expect(texts()).toEqual(['d', 'e', 'b'])
    const after = elementsByText()
    expect(after.get('d')).toBe(before.get('d'))
    expect(after.get('b')).toBe(before.get('b'))
    expect(before.get('e')).toBeUndefined()
  })

  it('patches props while moving a keyed child', () => {
    root.render(
      <ul>
        <li key="a" class="old">
          a
        </li>
        <li key="b">b</li>
      </ul>,
    )
    const a = elementsByText().get('a')
    root.render(
      <ul>
        <li key="b">b</li>
        <li key="a" class="new">
          a
        </li>
      </ul>,
    )
    expect(texts()).toEqual(['b', 'a'])
    expect(elementsByText().get('a')).toBe(a)
    expect(a?.getAttribute('class')).toBe('new')
  })

  it('does not reuse a keyed node for a different element type', () => {
    root.render(
      <div>
        <span key="x">x</span>
      </div>,
    )
    const span = container.querySelector('span')
    root.render(
      <div>
        <b key="x">x</b>
      </div>,
    )
    expect(container.innerHTML).toBe('<div><b>x</b></div>')
    expect(container.querySelector('b')).not.toBe(span)
  })

  it('reorders keyed fragments as whole units', () => {
    function Pair(props: { id: string }) {
      return (
        <>
          <dt>{props.id}</dt>
          <dd>{props.id}-def</dd>
        </>
      )
    }
    root.render(
      <dl>
        <Pair key="one" id="one" />
        <Pair key="two" id="two" />
      </dl>,
    )
    const firstDt = container.querySelector('dt')
    root.render(
      <dl>
        <Pair key="two" id="two" />
        <Pair key="one" id="one" />
      </dl>,
    )
    expect(container.textContent).toBe('twotwo-defoneone-def')
    const dts = container.querySelectorAll('dt')
    expect(dts[1]).toBe(firstDt)
  })

  it('falls back to index matching for unkeyed children', () => {
    root.render(
      <div>
        <p>a</p>
        <p>b</p>
      </div>,
    )
    const first = container.querySelectorAll('p')[0]
    root.render(
      <div>
        <p>b</p>
        <p>a</p>
      </div>,
    )
    expect(container.querySelectorAll('p')[0]).toBe(first)
    expect(first?.textContent).toBe('b')
  })
})
