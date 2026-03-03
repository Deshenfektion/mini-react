import { beforeEach, describe, expect, it } from 'vitest'
import { useState } from '../../src/hooks/useState'
import type { StateSetter } from '../../src/hooks/useState'
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

describe('useState', () => {
  it('re-renders with the new state after a click', async () => {
    function Counter() {
      const [count, setCount] = useState(0)
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
    expect(container.textContent).toBe('0')
    click('button')
    await flushRenders()
    expect(container.textContent).toBe('1')
  })

  it('patches the existing dom instead of remounting', async () => {
    function Counter() {
      const [count, setCount] = useState(0)
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
    const button = container.querySelector('button')
    click('button')
    await flushRenders()
    expect(container.querySelector('button')).toBe(button)
  })

  it('batches multiple updates into one render', async () => {
    let renders = 0
    function Counter() {
      renders += 1
      const [count, setCount] = useState(0)
      return (
        <button
          onClick={() => {
            setCount((c) => c + 1)
            setCount((c) => c + 1)
            setCount((c) => c + 1)
          }}
        >
          {count}
        </button>
      )
    }
    root.render(<Counter />)
    click('button')
    await flushRenders()
    expect(container.textContent).toBe('3')
    expect(renders).toBe(2)
  })

  it('shows the stale closure pitfall with direct updates', async () => {
    function Counter() {
      const [count, setCount] = useState(0)
      return (
        <button
          onClick={() => {
            setCount(count + 1)
            setCount(count + 1)
          }}
        >
          {count}
        </button>
      )
    }
    root.render(<Counter />)
    click('button')
    await flushRenders()
    expect(container.textContent).toBe('1')
  })

  it('bails out when the next state is identical', async () => {
    let renders = 0
    function Counter() {
      renders += 1
      const [count, setCount] = useState(0)
      return (
        <button
          onClick={() => {
            setCount(0)
          }}
        >
          {count}
        </button>
      )
    }
    root.render(<Counter />)
    click('button')
    await flushRenders()
    expect(renders).toBe(1)
  })

  it('keeps the setter identity stable across renders', async () => {
    const setters: StateSetter<number>[] = []
    function Counter() {
      const [count, setCount] = useState(0)
      setters.push(setCount)
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
    click('button')
    await flushRenders()
    expect(setters).toHaveLength(2)
    expect(setters[0]).toBe(setters[1])
  })

  it('tracks independent slots for multiple useState calls', async () => {
    function Form() {
      const [name, setName] = useState('anon')
      const [age, setAge] = useState(0)
      return (
        <div>
          <button
            id="name"
            onClick={() => {
              setName('ada')
            }}
          />
          <button
            id="age"
            onClick={() => {
              setAge(36)
            }}
          />
          <p>
            {name}:{age}
          </p>
        </div>
      )
    }
    root.render(<Form />)
    click('#name')
    await flushRenders()
    expect(container.querySelector('p')?.textContent).toBe('ada:0')
    click('#age')
    await flushRenders()
    expect(container.querySelector('p')?.textContent).toBe('ada:36')
  })

  it('calls a lazy initializer exactly once', async () => {
    let initializations = 0
    function Counter() {
      const [count, setCount] = useState(() => {
        initializations += 1
        return 10
      })
      return (
        <button
          onClick={() => {
            setCount((c) => c + 1)
          }}
        >
          {count}
        </button>
      )
    }
    root.render(<Counter />)
    click('button')
    await flushRenders()
    click('button')
    await flushRenders()
    expect(container.textContent).toBe('12')
    expect(initializations).toBe(1)
  })

  it('preserves child state when the parent re-renders', async () => {
    function Child() {
      const [count, setCount] = useState(0)
      return (
        <button
          id="child"
          onClick={() => {
            setCount(count + 1)
          }}
        >
          {count}
        </button>
      )
    }
    function Parent() {
      const [label, setLabel] = useState('a')
      return (
        <div>
          <button
            id="parent"
            onClick={() => {
              setLabel(label + '!')
            }}
          >
            {label}
          </button>
          <Child />
        </div>
      )
    }
    root.render(<Parent />)
    click('#child')
    await flushRenders()
    expect(container.querySelector('#child')?.textContent).toBe('1')
    click('#parent')
    await flushRenders()
    expect(container.querySelector('#parent')?.textContent).toBe('a!')
    expect(container.querySelector('#child')?.textContent).toBe('1')
  })

  it('moves component state along with its key', async () => {
    function Counter(props: { id: string }) {
      const [count, setCount] = useState(0)
      return (
        <button
          id={props.id}
          onClick={() => {
            setCount(count + 1)
          }}
        >
          {props.id}:{count}
        </button>
      )
    }
    function App(props: { order: string[] }) {
      return (
        <div>
          {props.order.map((id) => (
            <Counter key={id} id={id} />
          ))}
        </div>
      )
    }
    root.render(<App order={['x', 'y']} />)
    click('#x')
    await flushRenders()
    expect(container.querySelector('#x')?.textContent).toBe('x:1')
    root.render(<App order={['y', 'x']} />)
    const buttons = [...container.querySelectorAll('button')]
    expect(buttons.map((b) => b.textContent)).toEqual(['y:0', 'x:1'])
  })

  it('ignores updates after unmount', async () => {
    const captured: { setter: StateSetter<number> | null } = { setter: null }
    function Counter() {
      const [count, setCount] = useState(0)
      captured.setter = setCount
      return <p>{count}</p>
    }
    root.render(<Counter />)
    root.unmount()
    captured.setter?.(5)
    await flushRenders()
    expect(container.innerHTML).toBe('')
  })

  it('throws when called outside of rendering', () => {
    expect(() => useState(0)).toThrow(
      'Hooks can only be called while a component is rendering',
    )
  })

  it('rejects a hook count that shrinks between renders', () => {
    function Conditional(props: { extra: boolean }) {
      const [first] = useState('a')
      if (props.extra) {
        useState('b')
      }
      return <p>{first}</p>
    }
    root.render(<Conditional extra={true} />)
    expect(() => {
      root.render(<Conditional extra={false} />)
    }).toThrow('Hook order changed between renders')
  })

  it('rejects a hook count that grows between renders', () => {
    function Conditional(props: { extra: boolean }) {
      const [first] = useState('a')
      if (props.extra) {
        useState('b')
      }
      return <p>{first}</p>
    }
    root.render(<Conditional extra={false} />)
    expect(() => {
      root.render(<Conditional extra={true} />)
    }).toThrow('Hook order changed between renders')
  })
})
