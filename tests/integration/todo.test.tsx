import { beforeEach, describe, expect, it } from 'vitest'
import { TodoList } from '../../examples/TodoList'
import { createRoot } from '../../src/renderer/root'
import type { Root } from '../../src/renderer/root'
import { flushRenders } from '../support/async'

let container: HTMLElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.replaceChildren(container)
  root = createRoot(container)
  root.render(<TodoList />)
})

function titles(): string[] {
  return [...container.querySelectorAll('.todo .grow')].map((el) => el.textContent)
}

function rowAt(index: number): Element | undefined {
  return container.querySelectorAll('.todo')[index]
}

function clickIn(row: Element | undefined, label: string): void {
  const button = [...(row?.querySelectorAll('button') ?? [])].find(
    (candidate) => candidate.textContent === label,
  )
  button?.click()
}

async function type(value: string): Promise<void> {
  const input = container.querySelector('input[placeholder]')
  if (input instanceof HTMLInputElement) {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
  await flushRenders()
}

async function submit(): Promise<void> {
  container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }))
  await flushRenders()
}

describe('todo example', () => {
  it('renders the seeded todos', () => {
    expect(titles()).toEqual([
      'Read the reconciler',
      'Reorder this list and watch the DOM',
    ])
  })

  it('adds a todo through the form', async () => {
    await type('Write the README')
    await submit()
    expect(titles()).toContain('Write the README')
  })

  it('ignores an empty submission', async () => {
    const before = titles().length
    await type('   ')
    await submit()
    expect(titles()).toHaveLength(before)
  })

  it('clears the draft after adding', async () => {
    await type('Ship it')
    await submit()
    const input = container.querySelector('input[placeholder]')
    expect((input as HTMLInputElement).value).toBe('')
  })

  it('toggles a todo and updates the remaining count', async () => {
    expect(container.textContent).toContain('1 left')
    const checkboxes = container.querySelectorAll('input[type=checkbox]')
    checkboxes[1]?.dispatchEvent(new Event('change', { bubbles: true }))
    await flushRenders()
    expect(container.textContent).toContain('0 left')
    checkboxes[0]?.dispatchEvent(new Event('change', { bubbles: true }))
    await flushRenders()
    expect(container.textContent).toContain('1 left')
  })

  it('removes a todo', async () => {
    clickIn(rowAt(0), 'remove')
    await flushRenders()
    expect(titles()).toEqual(['Reorder this list and watch the DOM'])
  })

  it('reuses dom nodes when reordering', async () => {
    const before = rowAt(1)
    clickIn(rowAt(1), 'up')
    await flushRenders()
    expect(titles()[0]).toBe('Reorder this list and watch the DOM')
    expect(rowAt(0)).toBe(before)
  })

  it('filters to active todos', async () => {
    const active = [...container.querySelectorAll('.chip')].find(
      (chip) => chip.textContent === 'active',
    )
    ;(active as HTMLElement).click()
    await flushRenders()
    expect(titles()).toEqual(['Reorder this list and watch the DOM'])
  })

  it('shows the empty state once every todo is removed', async () => {
    clickIn(rowAt(0), 'remove')
    await flushRenders()
    clickIn(rowAt(0), 'remove')
    await flushRenders()
    expect(container.querySelector('.empty')?.textContent).toBe('Nothing here.')
    expect(container.querySelector('.todos')).toBeNull()
  })

  it('coalesces two removals in one tick because both read the same state', async () => {
    clickIn(rowAt(0), 'remove')
    clickIn(rowAt(0), 'remove')
    await flushRenders()
    expect(titles()).toEqual(['Reorder this list and watch the DOM'])
  })
})
