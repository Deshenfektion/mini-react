import { useState } from 'mini-react'

export function Counter() {
  const [count, setCount] = useState(0)
  const [step, setStep] = useState(1)

  return (
    <section>
      <h2>Counter</h2>
      <p class="hint">
        Demonstrates state slots, batched updates, and in-place DOM patching.
      </p>
      <output class="counter-value">{count}</output>
      <div class="row">
        <button
          onClick={() => {
            setCount(count - step)
          }}
        >
          minus {step}
        </button>
        <button
          onClick={() => {
            setCount(count + step)
          }}
        >
          plus {step}
        </button>
        <button
          onClick={() => {
            setCount(0)
          }}
        >
          reset
        </button>
      </div>
      <label class="field">
        <span>Step</span>
        <input
          type="number"
          value={String(step)}
          onInput={(event: Event) => {
            const next = Number((event.target as HTMLInputElement).value)
            setStep(Number.isFinite(next) ? next : 1)
          }}
        />
      </label>
      <div class="row">
        <button
          onClick={() => {
            setCount((value) => value + 1)
            setCount((value) => value + 1)
            setCount((value) => value + 1)
          }}
        >
          +3 in one batch
        </button>
      </div>
      <p class="hint">
        The batch button calls the setter three times; the scheduler collapses that into a
        single re-render.
      </p>
    </section>
  )
}
