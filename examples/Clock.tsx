import { useEffect, useState } from 'mini-react'

export function Clock() {
  const [running, setRunning] = useState(true)
  const [ticks, setTicks] = useState(0)

  useEffect(() => {
    if (!running) {
      return
    }
    const id = setInterval(() => {
      setTicks((value) => value + 1)
    }, 1000)
    return () => {
      clearInterval(id)
    }
  }, [running])

  return (
    <section>
      <h2>Clock</h2>
      <p class="hint">
        Demonstrates effects with dependencies and cleanup on both re-run and unmount.
      </p>
      <output class="counter-value">{ticks}</output>
      <div class="row">
        <button
          onClick={() => {
            setRunning(!running)
          }}
        >
          {running ? 'pause' : 'resume'}
        </button>
        <button
          onClick={() => {
            setTicks(0)
          }}
        >
          reset
        </button>
      </div>
      <p class="hint">
        Toggling pause changes the effect dependency, so the previous interval is cleared
        before a new one is created. Switching tabs unmounts this component and clears it
        entirely.
      </p>
    </section>
  )
}
