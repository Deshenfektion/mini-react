import { beforeEach, describe, expect, it } from 'vitest'
import { useEffect } from '../../src/hooks/useEffect'
import { useState } from '../../src/hooks/useState'
import { createRoot } from '../../src/renderer/root'
import type { Root } from '../../src/renderer/root'
import { flushRenders } from '../support/async'

let container: HTMLElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.replaceChildren(container)
  root = createRoot(container)
})

function click(selector: string): void {
  const el = container.querySelector(selector)
  if (el instanceof HTMLElement) {
    el.click()
  }
}

describe('useEffect', () => {
  it('runs after the commit, not during render', async () => {
    const order: string[] = []
    function App() {
      order.push('render')
      useEffect(() => {
        order.push('effect')
      })
      return <p>x</p>
    }
    root.render(<App />)
    expect(order).toEqual(['render'])
    await flushRenders()
    expect(order).toEqual(['render', 'effect'])
  })

  it('sees the committed dom', async () => {
    let seen = ''
    function App() {
      useEffect(() => {
        seen = container.querySelector('p')?.textContent ?? ''
      })
      return <p>committed</p>
    }
    root.render(<App />)
    await flushRenders()
    expect(seen).toBe('committed')
  })

  it('runs on every render without a deps array', async () => {
    let runs = 0
    function App(props: { value: number }) {
      useEffect(() => {
        runs += 1
      })
      return <p>{props.value}</p>
    }
    root.render(<App value={1} />)
    await flushRenders()
    root.render(<App value={2} />)
    await flushRenders()
    expect(runs).toBe(2)
  })

  it('runs once with an empty deps array', async () => {
    let runs = 0
    function App(props: { value: number }) {
      useEffect(() => {
        runs += 1
      }, [])
      return <p>{props.value}</p>
    }
    root.render(<App value={1} />)
    await flushRenders()
    root.render(<App value={2} />)
    await flushRenders()
    expect(runs).toBe(1)
  })

  it('re-runs only when a dependency changes', async () => {
    let runs = 0
    function App(props: { a: number; b: number }) {
      useEffect(() => {
        runs += 1
      }, [props.a])
      return <p>{props.b}</p>
    }
    root.render(<App a={1} b={1} />)
    await flushRenders()
    root.render(<App a={1} b={2} />)
    await flushRenders()
    expect(runs).toBe(1)
    root.render(<App a={2} b={2} />)
    await flushRenders()
    expect(runs).toBe(2)
  })

  it('runs cleanup before the next effect', async () => {
    const order: string[] = []
    function App(props: { value: number }) {
      useEffect(() => {
        order.push(`effect:${String(props.value)}`)
        return () => {
          order.push(`cleanup:${String(props.value)}`)
        }
      }, [props.value])
      return <p>{props.value}</p>
    }
    root.render(<App value={1} />)
    await flushRenders()
    root.render(<App value={2} />)
    await flushRenders()
    expect(order).toEqual(['effect:1', 'cleanup:1', 'effect:2'])
  })

  it('runs cleanup on unmount', async () => {
    const order: string[] = []
    function Child() {
      useEffect(() => {
        order.push('mount')
        return () => {
          order.push('unmount')
        }
      }, [])
      return <p>child</p>
    }
    function App(props: { show: boolean }) {
      return <div>{props.show && <Child />}</div>
    }
    root.render(<App show={true} />)
    await flushRenders()
    expect(order).toEqual(['mount'])
    root.render(<App show={false} />)
    await flushRenders()
    expect(order).toEqual(['mount', 'unmount'])
  })

  it('runs cleanup when the whole root unmounts', async () => {
    let cleaned = false
    function App() {
      useEffect(() => {
        return () => {
          cleaned = true
        }
      }, [])
      return <p>x</p>
    }
    root.render(<App />)
    await flushRenders()
    root.unmount()
    expect(cleaned).toBe(true)
  })

  it('does not run an effect scheduled by a component that unmounted first', async () => {
    let runs = 0
    function Child() {
      useEffect(() => {
        runs += 1
      })
      return <p>child</p>
    }
    function App(props: { show: boolean }) {
      return <div>{props.show && <Child />}</div>
    }
    root.render(<App show={true} />)
    root.render(<App show={false} />)
    await flushRenders()
    expect(runs).toBe(0)
  })

  it('captures the latest props in the effect closure', async () => {
    const seen: number[] = []
    function App(props: { value: number }) {
      useEffect(() => {
        seen.push(props.value)
      })
      return <p>{props.value}</p>
    }
    root.render(<App value={1} />)
    await flushRenders()
    root.render(<App value={2} />)
    await flushRenders()
    expect(seen).toEqual([1, 2])
  })

  it('supports state updates from inside an effect', async () => {
    function App() {
      const [ready, setReady] = useState(false)
      useEffect(() => {
        setReady(true)
      }, [])
      return <p>{ready ? 'ready' : 'waiting'}</p>
    }
    root.render(<App />)
    await flushRenders()
    expect(container.textContent).toBe('ready')
  })

  it('keeps effects and state slots independent', async () => {
    const effects: number[] = []
    function Counter() {
      const [count, setCount] = useState(0)
      useEffect(() => {
        effects.push(count)
      }, [count])
      return (
        <button
          onClick={() => {
            setCount(count + 1)
          }}
        >
          {count}
        </button>
      )
    }
    root.render(<Counter />)
    await flushRenders()
    click('button')
    await flushRenders()
    expect(container.textContent).toBe('1')
    expect(effects).toEqual([0, 1])
  })

  it('rejects swapping a state hook for an effect hook', () => {
    function Unstable(props: { useEffectFirst: boolean }) {
      if (props.useEffectFirst) {
        useEffect(() => undefined)
      } else {
        useState(0)
      }
      return <p>x</p>
    }
    root.render(<Unstable useEffectFirst={false} />)
    expect(() => {
      root.render(<Unstable useEffectFirst={true} />)
    }).toThrow('Hook order changed between renders')
  })
})
