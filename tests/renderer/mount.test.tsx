import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from '../../src/renderer/root'

let container: HTMLElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.replaceChildren(container)
})

describe('createRoot().render', () => {
  it('mounts a host element with text', () => {
    createRoot(container).render(<h1>hello</h1>)
    expect(container.innerHTML).toBe('<h1>hello</h1>')
  })

  it('mounts nested trees', () => {
    createRoot(container).render(
      <section>
        <header>
          <h2>title</h2>
        </header>
        <p>body</p>
      </section>,
    )
    expect(container.innerHTML).toBe(
      '<section><header><h2>title</h2></header><p>body</p></section>',
    )
  })

  it('applies attributes from props', () => {
    createRoot(container).render(<a href="/docs" id="link" />)
    const anchor = container.querySelector('a')
    expect(anchor?.getAttribute('href')).toBe('/docs')
    expect(anchor?.id).toBe('link')
  })

  it('applies styles and classes', () => {
    createRoot(container).render(
      <div className="box" style={{ color: 'red' }}>
        x
      </div>,
    )
    const div = container.querySelector('div')
    expect(div?.className).toBe('box')
    expect(div?.style.color).toBe('red')
  })

  it('mounts fragments without a wrapper node', () => {
    createRoot(container).render(
      <>
        <span>a</span>
        <span>b</span>
      </>,
    )
    expect(container.innerHTML).toBe('<span>a</span><span>b</span>')
  })

  it('flattens nested fragments', () => {
    createRoot(container).render(
      <>
        <i>1</i>
        <>
          <i>2</i>
          <i>3</i>
        </>
      </>,
    )
    expect(container.innerHTML).toBe('<i>1</i><i>2</i><i>3</i>')
  })

  it('renders number children, including zero', () => {
    createRoot(container).render(<p>{0}</p>)
    expect(container.innerHTML).toBe('<p>0</p>')
  })

  it('skips conditional children that render nothing', () => {
    const items: string[] = []
    createRoot(container).render(
      <div>{items.length > 0 && <span>never</span>}fallback</div>,
    )
    expect(container.innerHTML).toBe('<div>fallback</div>')
  })

  it('renders list children', () => {
    const items = ['a', 'b', 'c']
    createRoot(container).render(
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>,
    )
    expect(container.querySelectorAll('li')).toHaveLength(3)
    expect(container.textContent).toBe('abc')
  })

  it('wires event listeners from props', () => {
    let clicks = 0
    createRoot(container).render(
      <button
        onClick={() => {
          clicks += 1
        }}
      >
        go
      </button>,
    )
    container.querySelector('button')?.click()
    expect(clicks).toBe(1)
  })

  it('replaces previous content on re-render', () => {
    const root = createRoot(container)
    root.render(<p>first</p>)
    root.render(<p>second</p>)
    expect(container.innerHTML).toBe('<p>second</p>')
  })

  it('clears the container on unmount', () => {
    const root = createRoot(container)
    root.render(<p>gone</p>)
    root.unmount()
    expect(container.innerHTML).toBe('')
  })
})
