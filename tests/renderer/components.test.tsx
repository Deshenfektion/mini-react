import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from '../../src/renderer/root'
import type { ElementChildren } from '../../src/shared/types'

let container: HTMLElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.replaceChildren(container)
})

describe('function components', () => {
  it('renders component output', () => {
    function Hello() {
      return <h1>hello</h1>
    }
    createRoot(container).render(<Hello />)
    expect(container.innerHTML).toBe('<h1>hello</h1>')
  })

  it('passes props into the component', () => {
    function Greeting(props: { name: string }) {
      return <p>hi {props.name}</p>
    }
    createRoot(container).render(<Greeting name="Ada" />)
    expect(container.innerHTML).toBe('<p>hi Ada</p>')
  })

  it('composes nested components', () => {
    function Label(props: { text: string }) {
      return <span>{props.text}</span>
    }
    function Badge(props: { text: string }) {
      return (
        <strong>
          <Label text={props.text} />
        </strong>
      )
    }
    createRoot(container).render(<Badge text="new" />)
    expect(container.innerHTML).toBe('<strong><span>new</span></strong>')
  })

  it('passes children through props', () => {
    function Layout(props: { children?: ElementChildren }) {
      return <main>{props.children}</main>
    }
    createRoot(container).render(
      <Layout>
        <p>a</p>
        <p>b</p>
      </Layout>,
    )
    expect(container.innerHTML).toBe('<main><p>a</p><p>b</p></main>')
  })

  it('renders nothing for a null return', () => {
    function Nothing() {
      return null
    }
    createRoot(container).render(
      <div>
        <Nothing />
        after
      </div>,
    )
    expect(container.innerHTML).toBe('<div>after</div>')
  })

  it('renders fragment output without a wrapper', () => {
    function Pair() {
      return (
        <>
          <dt>term</dt>
          <dd>def</dd>
        </>
      )
    }
    createRoot(container).render(
      <dl>
        <Pair />
      </dl>,
    )
    expect(container.innerHTML).toBe('<dl><dt>term</dt><dd>def</dd></dl>')
  })

  it('supports conditional branches inside components', () => {
    function Status(props: { online: boolean }) {
      return props.online ? <em>online</em> : <em>offline</em>
    }
    createRoot(container).render(<Status online={false} />)
    expect(container.innerHTML).toBe('<em>offline</em>')
  })

  it('renders components inside lists', () => {
    function Item(props: { label: string }) {
      return <li>{props.label}</li>
    }
    const labels = ['x', 'y']
    createRoot(container).render(
      <ul>
        {labels.map((label) => (
          <Item key={label} label={label} />
        ))}
      </ul>,
    )
    expect(container.innerHTML).toBe('<ul><li>x</li><li>y</li></ul>')
  })
})
