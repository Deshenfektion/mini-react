import { describe, expect, it } from 'vitest'
import {
  diffProperties,
  eventNameOf,
  isEventProp,
  setProperty,
  updateProperty,
} from '../../src/dom/properties'

function makeDiv(): HTMLElement {
  return document.createElement('div')
}

describe('setProperty', () => {
  it('sets string attributes', () => {
    const dom = makeDiv()
    setProperty(dom, 'id', 'app')
    expect(dom.getAttribute('id')).toBe('app')
  })

  it('sets numeric attributes as strings', () => {
    const dom = makeDiv()
    setProperty(dom, 'tabindex', 2)
    expect(dom.getAttribute('tabindex')).toBe('2')
  })

  it('renders true as an empty boolean attribute', () => {
    const dom = document.createElement('input')
    setProperty(dom, 'required', true)
    expect(dom.hasAttribute('required')).toBe(true)
    expect(dom.getAttribute('required')).toBe('')
  })

  it('removes the attribute for false, null, and undefined', () => {
    const dom = makeDiv()
    dom.setAttribute('hidden', '')
    setProperty(dom, 'hidden', false)
    expect(dom.hasAttribute('hidden')).toBe(false)
    dom.setAttribute('title', 'x')
    setProperty(dom, 'title', null)
    expect(dom.hasAttribute('title')).toBe(false)
    dom.setAttribute('lang', 'en')
    setProperty(dom, 'lang', undefined)
    expect(dom.hasAttribute('lang')).toBe(false)
  })

  it('maps className to the class attribute', () => {
    const dom = makeDiv()
    setProperty(dom, 'className', 'card active')
    expect(dom.getAttribute('class')).toBe('card active')
  })

  it('assigns value and checked as dom properties', () => {
    const input = document.createElement('input')
    setProperty(input, 'value', 'typed')
    expect(input.value).toBe('typed')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    setProperty(checkbox, 'checked', true)
    expect(checkbox.checked).toBe(true)
  })

  it('applies style objects with camelCase properties', () => {
    const dom = makeDiv()
    setProperty(dom, 'style', { color: 'red', backgroundColor: 'blue' })
    expect(dom.style.color).toBe('red')
    expect(dom.style.backgroundColor).toBe('blue')
  })

  it('applies css custom properties', () => {
    const dom = makeDiv()
    setProperty(dom, 'style', { '--gap': '4px' })
    expect(dom.style.getPropertyValue('--gap')).toBe('4px')
  })

  it('applies style strings', () => {
    const dom = makeDiv()
    setProperty(dom, 'style', 'color: green')
    expect(dom.style.color).toBe('green')
  })

  it('attaches event listeners for on-prefixed function props', () => {
    const dom = makeDiv()
    let clicks = 0
    setProperty(dom, 'onClick', () => {
      clicks += 1
    })
    dom.dispatchEvent(new Event('click'))
    dom.dispatchEvent(new Event('click'))
    expect(clicks).toBe(2)
  })
})

describe('updateProperty', () => {
  it('replaces an event listener without stacking', () => {
    const dom = makeDiv()
    let firstCalls = 0
    let secondCalls = 0
    const first = () => {
      firstCalls += 1
    }
    const second = () => {
      secondCalls += 1
    }
    updateProperty(dom, 'onClick', undefined, first)
    updateProperty(dom, 'onClick', first, second)
    dom.dispatchEvent(new Event('click'))
    expect(firstCalls).toBe(0)
    expect(secondCalls).toBe(1)
  })

  it('removes an event listener when the next value is gone', () => {
    const dom = makeDiv()
    let calls = 0
    const handler = () => {
      calls += 1
    }
    updateProperty(dom, 'onClick', undefined, handler)
    updateProperty(dom, 'onClick', handler, undefined)
    dom.dispatchEvent(new Event('click'))
    expect(calls).toBe(0)
  })

  it('replaces the full style declaration', () => {
    const dom = makeDiv()
    updateProperty(dom, 'style', undefined, { color: 'red', margin: '4px' })
    updateProperty(dom, 'style', { color: 'red', margin: '4px' }, { color: 'blue' })
    expect(dom.style.color).toBe('blue')
    expect(dom.style.margin).toBe('')
  })
})

describe('diffProperties', () => {
  it('removes props absent from the next render', () => {
    const dom = makeDiv()
    diffProperties(dom, {}, { id: 'a', title: 'x' })
    diffProperties(dom, { id: 'a', title: 'x' }, { id: 'a' })
    expect(dom.getAttribute('id')).toBe('a')
    expect(dom.hasAttribute('title')).toBe(false)
  })

  it('updates only changed props', () => {
    const dom = makeDiv()
    diffProperties(dom, {}, { id: 'a', lang: 'en' })
    dom.setAttribute('id', 'mutated-outside')
    diffProperties(dom, { id: 'a', lang: 'en' }, { id: 'a', lang: 'de' })
    expect(dom.getAttribute('id')).toBe('mutated-outside')
    expect(dom.getAttribute('lang')).toBe('de')
  })

  it('ignores the children prop', () => {
    const dom = makeDiv()
    diffProperties(dom, {}, { children: [] })
    expect(dom.attributes).toHaveLength(0)
  })
})

describe('event prop helpers', () => {
  it('recognizes only on-prefixed functions', () => {
    const handler = () => undefined
    expect(isEventProp('onClick', handler)).toBe(true)
    expect(isEventProp('onClick', 'not a function')).toBe(false)
    expect(isEventProp('once', handler)).toBe(true)
    expect(isEventProp('on', handler)).toBe(false)
    expect(isEventProp('id', handler)).toBe(false)
  })

  it('derives lowercase event names', () => {
    expect(eventNameOf('onClick')).toBe('click')
    expect(eventNameOf('onDblClick')).toBe('dblclick')
    expect(eventNameOf('onInput')).toBe('input')
  })
})
