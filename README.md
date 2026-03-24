# mini-react

React's hard parts — virtual DOM, keyed reconciliation, hooks, update batching, event delegation — rebuilt from scratch in TypeScript, with no React dependency.

**~1,000 lines of runtime. 160 tests, 98% coverage. 4.7 kB gzipped.**

```tsx
import { createRoot, useState } from 'mini-react'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

createRoot(document.getElementById('root')).render(<Counter />)
```

That works — JSX, state, re-rendering, event handling — on an implementation that goes all the way down to `document.createElement`.

## What's implemented

| Area        | Supported                                                                         |
| ----------- | --------------------------------------------------------------------------------- |
| JSX         | Automatic runtime (`jsx`/`jsxs`/`jsxDEV`), fragments, full TSX type checking      |
| Virtual DOM | Immutable element tree, persistent instance tree, in-place patching               |
| Reconciler  | Type-based subtree replacement, prop diffing, keyed child reuse and movement      |
| Hooks       | `useState` (lazy init, functional updates, bail-out), `useEffect` (deps, cleanup) |
| Scheduling  | Microtask batching, deduplicated re-renders, cascading updates in one cycle       |
| Events      | Root-level delegation, synthetic propagation, `stopPropagation`, cleanup          |

## Three ideas at the core of it

**Two trees, not one.** Components produce an immutable vnode tree that is thrown away after every render. A second, persistent _instance_ tree holds what must survive: DOM references, hook state, reconciled children. React draws the same line between elements and fibers — without it, there is nowhere for `useState` to live.

**Keyed reconciliation, right to left.** Children are matched by key, then patched from right to left while threading an anchor node. Because the anchor is always a node already placed correctly, one `insertBefore` per moved node is enough — no scratch space, no index bookkeeping.

**State updates don't render.** `setState` writes to a slot and enqueues the component's flush into a `Set`, drained once on the microtask queue. Three updates in one handler produce exactly one re-render, and work enqueued _during_ a drain joins the same cycle.

The full write-up — the reconciliation algorithm, why hooks are positional slots, event delegation, performance characteristics — is in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Run it

Requires Node.js 22+.

```
npm install
npm run dev    # examples app at localhost:5173
npm test       # 160 tests
npm run build  # typecheck + production build
```

`examples/` demonstrates the runtime end to end: a **Counter** (state, batching), a **Todo list** (keyed reconciliation, forms, parent-child callbacks), and a **Clock** (effects with dependencies and interval cleanup).

## What it deliberately doesn't do

Feature parity was never the goal, and each gap is a known trade rather than an oversight:

- Rendering is synchronous and non-interruptible — no fiber work loop, time slicing, or concurrent mode.
- No `memo`/`useMemo`/`useCallback`, so every re-render walks the full subtree below it.
- Hooks stop at `useState` and `useEffect`.
- No error boundaries, SSR, hydration, portals, or refs.

The [longer list](ARCHITECTURE.md#limitations) covers the smaller ones, including where this intentionally diverges from React's behaviour.
