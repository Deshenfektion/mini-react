const queue = new Set<() => void>()
let scheduled = false

export function enqueue(task: () => void): void {
  queue.add(task)
  if (!scheduled) {
    scheduled = true
    queueMicrotask(flush)
  }
}

function flush(): void {
  while (queue.size > 0) {
    const tasks = [...queue]
    queue.clear()
    for (const task of tasks) {
      task()
    }
  }
  scheduled = false
}
