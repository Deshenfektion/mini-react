export function setProperty(dom: HTMLElement, name: string, value: unknown): void {
  if (name === 'style') {
    applyStyle(dom, value)
  } else if (isEventProp(name, value)) {
    dom.addEventListener(eventNameOf(name), value)
  } else if (name === 'className') {
    setAttributeValue(dom, 'class', value)
  } else if (name === 'value' || name === 'checked') {
    assignDomProperty(dom, name, value)
  } else {
    setAttributeValue(dom, name, value)
  }
}

export function isEventProp(name: string, value: unknown): value is EventListener {
  return name.length > 2 && name.startsWith('on') && typeof value === 'function'
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
