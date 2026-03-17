export function flushRenders(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(() => {
      queueMicrotask(resolve)
    })
  })
}
