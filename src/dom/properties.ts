import { setEventHandler } from '../events/delegation'
import type { EventRoot } from '../events/delegation'
import type { Props } from '../shared/types'

export function updateProperty(
  dom: HTMLElement,
  name: string,
  prev: unknown,
  next: unknown,
  events: EventRoot,
): void {
  if (name === 'style') {
    applyStyle(dom, next)
  } else if (isEventName(name)) {
    setEventHandler(
      events,
      dom,
      eventNameOf(name),
      isEventProp(name, next) ? next : undefined,
    )
  } else if (name === 'className') {
    setAttributeValue(dom, 'class', next)
  } else if (name === 'value' || name === 'checked') {
    assignDomProperty(dom, name, next)
  } else {
    setAttributeValue(dom, name, next)
  }
}

export function diffProperties(
  dom: HTMLElement,
  prev: Props,
  next: Props,
  events: EventRoot,
): void {
  for (const name of Object.keys(prev)) {
    if (name !== 'children' && !(name in next)) {
      updateProperty(dom, name, prev[name], undefined, events)
    }
  }
  for (const name of Object.keys(next)) {
    if (name === 'children') {
      continue
    }
    const prevValue = prev[name]
    const nextValue = next[name]
    if (prevValue !== nextValue) {
      updateProperty(dom, name, prevValue, nextValue, events)
    }
  }
}

export function isEventName(name: string): boolean {
  return name.length > 2 && name.startsWith('on')
}

export function isEventProp(name: string, value: unknown): value is EventListener {
  return isEventName(name) && typeof value === 'function'
}

export function eventNameOf(propName: string): string {
  return propName.slice(2).toLowerCase()
}

function setAttributeValue(dom: HTMLElement, name: string, value: unknown): void {
  if (value === true) {
    dom.setAttribute(name, '')
  } else if (value === false || value === null || value === undefined) {
    dom.removeAttribute(name)
  } else {
    dom.setAttribute(name, stringify(value))
  }
}

function assignDomProperty(dom: HTMLElement, name: string, value: unknown): void {
  const target = dom as unknown as Record<string, unknown>
  target[name] = value ?? ''
}

function applyStyle(dom: HTMLElement, value: unknown): void {
  if (typeof value === 'string') {
    dom.style.cssText = value
    return
  }
  dom.style.cssText = ''
  if (typeof value === 'object' && value !== null) {
    for (const [prop, propValue] of Object.entries(value)) {
      dom.style.setProperty(hyphenate(prop), stringify(propValue))
    }
  }
}

function hyphenate(prop: string): string {
  if (prop.startsWith('--')) {
    return prop
  }
  return prop.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
}

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value)
  }
  return ''
}
