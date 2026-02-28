import { describe, expect, it } from 'vitest'
import { enqueue } from '../../src/scheduler/scheduler'
import { flushRenders } from '../support/async'

describe('scheduler', () => {
  it('defers tasks to a microtask', async () => {
    let ran = false
    enqueue(() => {
      ran = true
    })
    expect(ran).toBe(false)
    await flushRenders()
    expect(ran).toBe(true)
  })

  it('dedupes an identical task enqueued twice in one tick', async () => {
    let runs = 0
    const task = () => {
      runs += 1
    }
    enqueue(task)
    enqueue(task)
    await flushRenders()
    expect(runs).toBe(1)
  })

  it('keeps distinct tasks separate', async () => {
    const order: string[] = []
    enqueue(() => {
      order.push('a')
    })
    enqueue(() => {
      order.push('b')
    })
    await flushRenders()
    expect(order).toEqual(['a', 'b'])
  })

  it('drains tasks enqueued during a flush in the same cycle', async () => {
    const order: string[] = []
    enqueue(() => {
      order.push('first')
      enqueue(() => {
        order.push('second')
      })
    })
    await flushRenders()
    expect(order).toEqual(['first', 'second'])
  })

  it('allows the same task to run again in a later tick', async () => {
    let runs = 0
    const task = () => {
      runs += 1
    }
    enqueue(task)
    await flushRenders()
    enqueue(task)
    await flushRenders()
    expect(runs).toBe(2)
  })
})
