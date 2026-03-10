export interface EventRoot {
  container: Element
  listeners: Map<string, EventListener>
}

const handlersByNode = new WeakMap<Element, Map<string, EventListener>>()

const NON_BUBBLING = new Set([
  'focus',
  'blur',
  'load',
  'error',
  'mouseenter',
  'mouseleave',
  'scroll',
])

export function createEventRoot(container: Element): EventRoot {
  return { container, listeners: new Map() }
}

export function destroyEventRoot(root: EventRoot): void {
  for (const [type, listener] of root.listeners) {
    root.container.removeEventListener(type, listener, capturesFor(type))
  }
  root.listeners.clear()
}

export function setEventHandler(
  root: EventRoot,
  dom: Element,
  type: string,
  handler: EventListener | undefined,
): void {
  const existing = handlersByNode.get(dom)
  if (!handler) {
    existing?.delete(type)
    return
  }
  if (existing) {
    existing.set(type, handler)
  } else {
    handlersByNode.set(dom, new Map([[type, handler]]))
  }
  listenAtRoot(root, type)
}

function listenAtRoot(root: EventRoot, type: string): void {
  if (root.listeners.has(type)) {
    return
  }
  const listener: EventListener = (event) => {
    dispatch(root, type, event)
  }
  root.listeners.set(type, listener)
  root.container.addEventListener(type, listener, capturesFor(type))
}

function dispatch(root: EventRoot, type: string, event: Event): void {
  const path = propagationPath(root, event.target)
  const propagation = { stopped: false }
  const native = event.stopPropagation.bind(event)
  Object.defineProperty(event, 'stopPropagation', {
    configurable: true,
    value: () => {
      propagation.stopped = true
      native()
    },
  })
  try {
    for (const node of path) {
      handlersByNode.get(node)?.get(type)?.call(node, event)
      if (propagation.stopped) {
        return
      }
    }
  } finally {
    delete (event as Partial<Event>).stopPropagation
  }
}

function propagationPath(root: EventRoot, target: EventTarget | null): Element[] {
  const path: Element[] = []
  let node = target instanceof Element ? target : null
  while (node) {
    path.push(node)
    if (node === root.container) {
      break
    }
    node = node.parentElement
  }
  return path
}

function capturesFor(type: string): boolean {
  return NON_BUBBLING.has(type)
}
