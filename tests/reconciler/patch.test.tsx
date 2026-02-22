import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from '../../src/renderer/root'
import type { Root } from '../../src/renderer/root'
import type { ElementChildren } from '../../src/shared/types'

let container: HTMLElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.replaceChildren(container)
  root = createRoot(container)
})

describe('patching', () => {
  it('updates text in place without replacing the node', () => {
    root.render(<p>first</p>)
    const textNode = container.querySelector('p')?.firstChild
    root.render(<p>second</p>)
    expect(container.innerHTML).toBe('<p>second</p>')
    expect(container.querySelector('p')?.firstChild).toBe(textNode)
  })

  it('keeps the same element when only props change', () => {
    root.render(<p id="a">x</p>)
    const el = container.querySelector('p')
    root.render(<p id="b">x</p>)
    expect(container.querySelector('p')).toBe(el)
    expect(el?.id).toBe('b')
  })

  it('removes props dropped between renders', () => {
    root.render(<p id="a" title="tip" />)
    root.render(<p id="a" />)
    const el = container.querySelector('p')
    expect(el?.hasAttribute('title')).toBe(false)
    expect(el?.id).toBe('a')
  })

  it('replaces the node when the element type changes', () => {
    root.render(<span>x</span>)
    root.render(<em>x</em>)
    expect(container.innerHTML).toBe('<em>x</em>')
  })

  it('preserves untouched siblings when one child is replaced', () => {
    root.render(
      <div>
        <span>keep</span>
        <span>swap</span>
      </div>,
    )
    const kept = container.querySelectorAll('span')[0]
    root.render(
      <div>
        <span>keep</span>
        <b>swap</b>
      </div>,
    )
    expect(container.innerHTML).toBe('<div><span>keep</span><b>swap</b></div>')
    expect(container.querySelectorAll('span')[0]).toBe(kept)
  })

  it('appends new trailing children', () => {
    root.render(
      <ul>
        <li>a</li>
      </ul>,
    )
    const first = container.querySelector('li')
    root.render(
      <ul>
        <li>a</li>
        <li>b</li>
      </ul>,
    )
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(container.querySelectorAll('li')[0]).toBe(first)
  })

  it('removes trailing children', () => {
    root.render(
      <ul>
        <li>a</li>
        <li>b</li>
        <li>c</li>
      </ul>,
    )
    root.render(
      <ul>
        <li>a</li>
      </ul>,
    )
    expect(container.innerHTML).toBe('<ul><li>a</li></ul>')
  })

  it('inserts children in the middle at the right position', () => {
    root.render(
      <div>
        <a>1</a>
      </div>,
    )
    root.render(
      <div>
        <a>1</a>
        <b>2</b>
        <i>3</i>
      </div>,
    )
    expect(container.innerHTML).toBe('<div><a>1</a><b>2</b><i>3</i></div>')
  })

  it('swaps event listeners without stacking', () => {
    let firstCalls = 0
    let secondCalls = 0
    root.render(
      <button
        onClick={() => {
          firstCalls += 1
        }}
      />,
    )
    root.render(
      <button
        onClick={() => {
          secondCalls += 1
        }}
      />,
    )
    container.querySelector('button')?.click()
    expect(firstCalls).toBe(0)
    expect(secondCalls).toBe(1)
  })

  it('updates styles and form properties in place', () => {
    root.render(<input style={{ color: 'red' }} value="a" />)
    const input = container.querySelector('input')
    root.render(<input style={{ color: 'blue' }} value="b" />)
    expect(container.querySelector('input')).toBe(input)
    expect(input?.style.color).toBe('blue')
    expect(input?.value).toBe('b')
  })
})

describe('patching components', () => {
  it('re-invokes components with new props', () => {
    function Greeting(props: { name: string }) {
      return <p>hi {props.name}</p>
    }
    root.render(<Greeting name="Ada" />)
    const p = container.querySelector('p')
    root.render(<Greeting name="Grace" />)
    expect(container.textContent).toBe('hi Grace')
    expect(container.querySelector('p')).toBe(p)
  })

  it('replaces output when a component switches branches', () => {
    function Status(props: { online: boolean }) {
      return props.online ? <em>online</em> : <s>offline</s>
    }
    root.render(<Status online={false} />)
    root.render(<Status online={true} />)
    expect(container.innerHTML).toBe('<em>online</em>')
  })

  it('toggles a null-rendering component while keeping siblings stable', () => {
    function Maybe(props: { show: boolean }) {
      return props.show ? <b>here</b> : null
    }
    function App(props: { show: boolean }) {
      return (
        <div>
          <Maybe show={props.show} />
          <span>tail</span>
        </div>
      )
    }
    root.render(<App show={false} />)
    const tail = container.querySelector('span')
    expect(container.textContent).toBe('tail')
    root.render(<App show={true} />)
    expect(container.innerHTML).toBe('<div><b>here</b><span>tail</span></div>')
    expect(container.querySelector('span')).toBe(tail)
    root.render(<App show={false} />)
    expect(container.textContent).toBe('tail')
    expect(container.querySelector('span')).toBe(tail)
  })

  it('replaces the tree when the component function changes', () => {
    function A() {
      return <p>a</p>
    }
    function B() {
      return <p>b</p>
    }
    root.render(<A />)
    const first = container.querySelector('p')
    root.render(<B />)
    expect(container.textContent).toBe('b')
    expect(container.querySelector('p')).not.toBe(first)
  })
})

describe('patching fragments', () => {
  it('patches fragment children against surrounding siblings', () => {
    function List(props: { items: string[] }) {
      return (
        <>
          {props.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </>
      )
    }
    root.render(
      <ul>
        <li>head</li>
        <List items={['a']} />
        <li>tail</li>
      </ul>,
    )
    root.render(
      <ul>
        <li>head</li>
        <List items={['a', 'b']} />
        <li>tail</li>
      </ul>,
    )
    expect(container.textContent).toBe('headabtail')
    const items = [...container.querySelectorAll('li')].map((li) => li.textContent)
    expect(items).toEqual(['head', 'a', 'b', 'tail'])
  })

  it('shrinks fragments without touching siblings', () => {
    function Wrap(props: { children?: ElementChildren }) {
      return <>{props.children}</>
    }
    root.render(
      <div>
        <Wrap>
          <i>1</i>
          <i>2</i>
        </Wrap>
        <span>end</span>
      </div>,
    )
    const end = container.querySelector('span')
    root.render(
      <div>
        <Wrap>
          <i>1</i>
        </Wrap>
        <span>end</span>
      </div>,
    )
    expect(container.innerHTML).toBe('<div><i>1</i><span>end</span></div>')
    expect(container.querySelector('span')).toBe(end)
  })
})
