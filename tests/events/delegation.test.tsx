import { beforeEach, describe, expect, it } from 'vitest'
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

function fire(selector: string, type = 'click'): void {
  container.querySelector(selector)?.dispatchEvent(new Event(type, { bubbles: true }))
}

describe('event delegation', () => {
  it('attaches a single native listener per event type at the root', () => {
    const seen: string[] = []
    const original = container.addEventListener.bind(container)
    container.addEventListener = (type: string, ...rest: unknown[]) => {
      seen.push(type)
      ;(original as (t: string, ...r: unknown[]) => void)(type, ...rest)
    }
    root.render(
      <div>
        <button id="a" onClick={() => undefined} />
        <button id="b" onClick={() => undefined} />
        <input id="c" onInput={() => undefined} />
      </div>,
    )
    expect(seen).toEqual(['click', 'input'])
  })

  it('invokes the handler of the element that was clicked', () => {
    const clicked: string[] = []
    root.render(
      <div>
        <button
          id="a"
          onClick={() => {
            clicked.push('a')
          }}
        />
        <button
          id="b"
          onClick={() => {
            clicked.push('b')
          }}
        />
      </div>,
    )
    fire('#b')
    expect(clicked).toEqual(['b'])
  })

  it('bubbles from target to ancestors', () => {
    const order: string[] = []
    root.render(
      <div
        onClick={() => {
          order.push('outer')
        }}
      >
        <span
          onClick={() => {
            order.push('inner')
          }}
        >
          <b id="leaf">x</b>
        </span>
      </div>,
    )
    fire('#leaf')
    expect(order).toEqual(['inner', 'outer'])
  })

  it('stops at stopPropagation', () => {
    const order: string[] = []
    root.render(
      <div
        onClick={() => {
          order.push('outer')
        }}
      >
        <span
          id="inner"
          onClick={(event: Event) => {
            order.push('inner')
            event.stopPropagation()
          }}
        />
      </div>,
    )
    fire('#inner')
    expect(order).toEqual(['inner'])
  })

  it('reports the original target on the event', () => {
    let targetId = ''
    root.render(
      <div
        onClick={(event: Event) => {
          targetId = (event.target as Element).id
        }}
      >
        <b id="leaf">x</b>
      </div>,
    )
    fire('#leaf')
    expect(targetId).toBe('leaf')
  })

  it('picks up handlers added on a later render', () => {
    let clicks = 0
    function App(props: { armed: boolean }) {
      return props.armed ? (
        <button
          id="a"
          onClick={() => {
            clicks += 1
          }}
        />
      ) : (
        <button id="a" />
      )
    }
    root.render(<App armed={false} />)
    fire('#a')
    expect(clicks).toBe(0)
    root.render(<App armed={true} />)
    fire('#a')
    expect(clicks).toBe(1)
  })

  it('drops handlers when the element unmounts', () => {
    let clicks = 0
    function App(props: { show: boolean }) {
      return (
        <div>
          {props.show && (
            <button
              id="a"
              onClick={() => {
                clicks += 1
              }}
            />
          )}
        </div>
      )
    }
    root.render(<App show={true} />)
    const button = container.querySelector('#a')
    root.render(<App show={false} />)
    button?.dispatchEvent(new Event('click', { bubbles: true }))
    expect(clicks).toBe(0)
  })

  it('delegates non-bubbling events through the capture phase', () => {
    let focused = 0
    root.render(
      <input
        id="field"
        onFocus={() => {
          focused += 1
        }}
      />,
    )
    container.querySelector('#field')?.dispatchEvent(new Event('focus'))
    expect(focused).toBe(1)
  })

  it('routes handlers to the right instance in a keyed list', async () => {
    const clicked: string[] = []
    function App(props: { order: string[] }) {
      return (
        <ul>
          {props.order.map((id) => (
            <li
              key={id}
              id={id}
              onClick={() => {
                clicked.push(id)
              }}
            />
          ))}
        </ul>
      )
    }
    root.render(<App order={['x', 'y']} />)
    root.render(<App order={['y', 'x']} />)
    await flushRenders()
    fire('#x')
    fire('#y')
    expect(clicked).toEqual(['x', 'y'])
  })

  it('detaches root listeners on unmount', () => {
    let clicks = 0
    root.render(
      <button
        id="a"
        onClick={() => {
          clicks += 1
        }}
      />,
    )
    const button = container.querySelector('#a')
    root.unmount()
    button?.dispatchEvent(new Event('click', { bubbles: true }))
    expect(clicks).toBe(0)
  })
})
