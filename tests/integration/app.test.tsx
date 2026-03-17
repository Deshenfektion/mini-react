import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../examples/App'
import { createRoot } from '../../src/renderer/root'
import type { Root } from '../../src/renderer/root'
import { flushRenders } from '../support/async'

let container: HTMLElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.replaceChildren(container)
  root = createRoot(container)
  root.render(<App />)
})

afterEach(() => {
  vi.useRealTimers()
})

function tab(label: string): void {
  const button = [...container.querySelectorAll('.tab')].find(
    (candidate) => candidate.textContent === label,
  )
  if (button instanceof HTMLElement) {
    button.click()
  }
}

async function settle(): Promise<void> {
  await flushRenders()
}

describe('example app', () => {
  it('starts on the counter tab', () => {
    expect(container.querySelector('h2')?.textContent).toBe('Counter')
  })

  it('marks the active tab', async () => {
    tab('Todos')
    await settle()
    const active = container.querySelector('.tab-active')
    expect(active?.textContent).toBe('Todos')
  })

  it('swaps panels without leaking the previous one', async () => {
    tab('Todos')
    await settle()
    expect(container.querySelector('h2')?.textContent).toBe('Todos')
    expect(container.querySelectorAll('h2')).toHaveLength(1)
  })

  it('batches three increments into one value change', async () => {
    const batch = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === '+3 in one batch',
    )
    batch?.click()
    await settle()
    expect(container.querySelector('output')?.textContent).toBe('3')
  })

  it('keeps counter state independent of the step field', async () => {
    const step = container.querySelector('input[type=number]')
    if (step instanceof HTMLInputElement) {
      step.value = '5'
      step.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await settle()
    const plus = [...container.querySelectorAll('button')].find((button) =>
      button.textContent.startsWith('plus'),
    )
    plus?.click()
    await settle()
    expect(container.querySelector('output')?.textContent).toBe('5')
  })

  it('runs the clock interval while mounted', async () => {
    tab('Clock')
    await settle()
    expect(container.querySelector('output')?.textContent).toBe('0')
    await vi.advanceTimersByTimeAsync(2000)
    await flushRenders()
    expect(container.querySelector('output')?.textContent).toBe('2')
  })

  it('clears the interval when the clock unmounts', async () => {
    tab('Clock')
    await settle()
    await vi.advanceTimersByTimeAsync(1000)
    await flushRenders()
    tab('Counter')
    await settle()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resets clock state when the tab is revisited', async () => {
    tab('Clock')
    await settle()
    await vi.advanceTimersByTimeAsync(2000)
    await flushRenders()
    tab('Counter')
    await settle()
    tab('Clock')
    await settle()
    expect(container.querySelector('output')?.textContent).toBe('0')
  })
})
