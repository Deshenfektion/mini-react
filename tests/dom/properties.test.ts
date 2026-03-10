import { beforeEach, describe, expect, it } from 'vitest'
import {
  diffProperties,
  eventNameOf,
  isEventName,
  isEventProp,
  updateProperty,
} from '../../src/dom/properties'
import { createEventRoot } from '../../src/events/delegation'
import type { EventRoot } from '../../src/events/delegation'

let container: HTMLElement
let events: EventRoot

beforeEach(() => {
  container = document.createElement('div')
  document.body.replaceChildren(container)
  events = createEventRoot(container)
})

function makeChild(tag = 'div'): HTMLElement {
  const dom = document.createElement(tag)
  container.appendChild(dom)
  return dom
}

describe('updateProperty', () => {
  it('sets string attributes', () => {
    const dom = makeChild()
    updateProperty(dom, 'id', undefined, 'app', events)
    expect(dom.getAttribute('id')).toBe('app')
  })

  it('sets numeric attributes as strings', () => {
    const dom = makeChild()
    updateProperty(dom, 'tabindex', undefined, 2, events)
    expect(dom.getAttribute('tabindex')).toBe('2')
  })

  it('renders true as an empty boolean attribute', () => {
    const dom = makeChild('input')
    updateProperty(dom, 'required', undefined, true, events)
    expect(dom.hasAttribute('required')).toBe(true)
    expect(dom.getAttribute('required')).toBe('')
  })

  it('removes the attribute for false, null, and undefined', () => {
    const dom = makeChild()
    updateProperty(dom, 'hidden', undefined, true, events)
    updateProperty(dom, 'hidden', true, false, events)
    expect(dom.hasAttribute('hidden')).toBe(false)
    updateProperty(dom, 'title', undefined, 'x', events)
    updateProperty(dom, 'title', 'x', null, events)
    expect(dom.hasAttribute('title')).toBe(false)
    updateProperty(dom, 'lang', undefined, 'en', events)
    updateProperty(dom, 'lang', 'en', undefined, events)
    expect(dom.hasAttribute('lang')).toBe(false)
  })

  it('maps className to the class attribute', () => {
    const dom = makeChild()
    updateProperty(dom, 'className', undefined, 'card active', events)
    expect(dom.getAttribute('class')).toBe('card active')
  })

  it('assigns value and checked as dom properties', () => {
    const input = makeChild('input') as HTMLInputElement
    updateProperty(input, 'value', undefined, 'typed', events)
    expect(input.value).toBe('typed')
    const checkbox = makeChild('input') as HTMLInputElement
    checkbox.type = 'checkbox'
    updateProperty(checkbox, 'checked', undefined, true, events)
    expect(checkbox.checked).toBe(true)
  })

  it('applies style objects with camelCase properties', () => {
    const dom = makeChild()
    updateProperty(
      dom,
      'style',
      undefined,
      { color: 'red', backgroundColor: 'blue' },
      events,
    )
    expect(dom.style.color).toBe('red')
    expect(dom.style.backgroundColor).toBe('blue')
  })

  it('applies css custom properties', () => {
    const dom = makeChild()
    updateProperty(dom, 'style', undefined, { '--gap': '4px' }, events)
    expect(dom.style.getPropertyValue('--gap')).toBe('4px')
  })

  it('applies style strings', () => {
    const dom = makeChild()
    updateProperty(dom, 'style', undefined, 'color: green', events)
    expect(dom.style.color).toBe('green')
  })

  it('replaces the full style declaration', () => {
    const dom = makeChild()
    updateProperty(dom, 'style', undefined, { color: 'red', margin: '4px' }, events)
    updateProperty(
      dom,
      'style',
      { color: 'red', margin: '4px' },
      { color: 'blue' },
      events,
    )
    expect(dom.style.color).toBe('blue')
    expect(dom.style.margin).toBe('')
  })

  it('registers event handlers that fire through the root', () => {
    const dom = makeChild()
    let clicks = 0
    updateProperty(
      dom,
      'onClick',
      undefined,
      () => {
        clicks += 1
      },
      events,
    )
    dom.dispatchEvent(new Event('click', { bubbles: true }))
    expect(clicks).toBe(1)
  })

  it('replaces an event handler without stacking', () => {
    const dom = makeChild()
    let firstCalls = 0
    let secondCalls = 0
    const first = () => {
      firstCalls += 1
    }
    const second = () => {
      secondCalls += 1
    }
    updateProperty(dom, 'onClick', undefined, first, events)
    updateProperty(dom, 'onClick', first, second, events)
    dom.dispatchEvent(new Event('click', { bubbles: true }))
    expect(firstCalls).toBe(0)
    expect(secondCalls).toBe(1)
  })

  it('removes an event handler when the next value is gone', () => {
    const dom = makeChild()
    let calls = 0
    const handler = () => {
      calls += 1
    }
    updateProperty(dom, 'onClick', undefined, handler, events)
    updateProperty(dom, 'onClick', handler, undefined, events)
    dom.dispatchEvent(new Event('click', { bubbles: true }))
    expect(calls).toBe(0)
  })
})

describe('diffProperties', () => {
  it('removes props absent from the next render', () => {
    const dom = makeChild()
    diffProperties(dom, {}, { id: 'a', title: 'x' }, events)
    diffProperties(dom, { id: 'a', title: 'x' }, { id: 'a' }, events)
    expect(dom.getAttribute('id')).toBe('a')
    expect(dom.hasAttribute('title')).toBe(false)
  })

  it('updates only changed props', () => {
    const dom = makeChild()
    diffProperties(dom, {}, { id: 'a', lang: 'en' }, events)
    dom.setAttribute('id', 'mutated-outside')
    diffProperties(dom, { id: 'a', lang: 'en' }, { id: 'a', lang: 'de' }, events)
    expect(dom.getAttribute('id')).toBe('mutated-outside')
    expect(dom.getAttribute('lang')).toBe('de')
  })

  it('ignores the children prop', () => {
    const dom = makeChild()
    diffProperties(dom, {}, { children: [] }, events)
    expect(dom.attributes).toHaveLength(0)
  })
})

describe('event prop helpers', () => {
  it('recognizes on-prefixed names', () => {
    expect(isEventName('onClick')).toBe(true)
    expect(isEventName('once')).toBe(true)
    expect(isEventName('on')).toBe(false)
    expect(isEventName('id')).toBe(false)
  })

  it('recognizes only on-prefixed functions as handlers', () => {
    const handler = () => undefined
    expect(isEventProp('onClick', handler)).toBe(true)
    expect(isEventProp('onClick', 'not a function')).toBe(false)
    expect(isEventProp('id', handler)).toBe(false)
  })

  it('derives lowercase event names', () => {
    expect(eventNameOf('onClick')).toBe('click')
    expect(eventNameOf('onDblClick')).toBe('dblclick')
    expect(eventNameOf('onInput')).toBe('input')
  })
})
