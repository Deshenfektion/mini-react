# mini-react

A miniature React-like runtime built from scratch in TypeScript. There is no React dependency: the element model, JSX runtime, virtual DOM, reconciler, hooks, scheduler, event system, and DOM renderer are all implemented here.

The goal is not feature parity. It is to implement the parts of a component framework that are genuinely hard — reconciliation, hook storage, update batching, event delegation — correctly enough to be tested, and small enough to be read in an afternoon.

```tsx
import { createRoot, useState } from 'mini-react'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

createRoot(document.getElementById('root')).render(<Counter />)
```

## Features

| Area        | Supported                                                                         |
| ----------- | --------------------------------------------------------------------------------- |
| JSX         | Automatic runtime (`jsx`/`jsxs`/`jsxDEV`), fragments, full TSX type checking      |
| Components  | Function components, props, children, composition, conditional output, lists      |
| Virtual DOM | Immutable element tree, persistent instance tree, in-place patching               |
| Reconciler  | Type-based subtree replacement, prop diffing, keyed child reuse and movement      |
| Hooks       | `useState` (lazy init, functional updates, bail-out), `useEffect` (deps, cleanup) |
| Scheduling  | Microtask batching, deduplicated re-renders, cascading updates in one cycle       |
| Events      | Root-level delegation, synthetic propagation, `stopPropagation`, cleanup          |
| Lifecycle   | Mount, update, unmount with effect disposal                                       |

160 tests, ~98% statement coverage of the runtime.

## Running it

Requires Node.js 22+.

```
npm install
npm run dev            # examples app at localhost:5173
npm test               # run the suite
npm run test:coverage  # run with coverage
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run build          # typecheck + production build
```

The `examples/` app demonstrates the runtime end to end: a **Counter** (state, batching), a **Todo list** (keyed reconciliation, forms, parent-child callbacks), and a **Clock** (effects with dependencies and interval cleanup).

## Architecture

The guiding principle is React's own: **UI is a description, not a construction.** Components return cheap immutable objects describing what the UI should look like. A separate reconciler makes the real DOM match that description with as few mutations as possible.

```
src/
  core/                element creation, jsx runtime, virtual node model
  dom/                 attribute/property/style writes
  events/              root-level event delegation
  hooks/               hook dispatcher, slot storage, useState, useEffect
  reconciler/          instance tree, mounting, diffing, unmounting
  renderer/            the public createRoot entry point
  scheduler/           microtask batching of pending work
  shared/              types, symbols, JSX type definitions
  jsx-runtime.ts       entry consumed by the automatic JSX transform
  jsx-dev-runtime.ts   dev-transform entry (jsxDEV)
examples/              runnable demo app
tests/                 mirrors src/, plus integration tests
```

### Two trees, not one

This is the central design decision. There are two parallel structures:

- **The vnode tree** — immutable, recreated on every render, cheap to allocate, thrown away after diffing. It is a _description_.
- **The instance tree** (`reconciler/instance.ts`) — persistent, holding everything that must survive a re-render: real DOM references, reconciled children, hook slots, and the component's `flush` callback.

React draws the same line between elements and fibers. Without it, there is nowhere for hook state to live, because the thing the user writes (`<Counter />`) is recreated from scratch every single render.

Instances come in four kinds. `host` and `text` own a DOM node; `fragment` and `component` own none, and instead report the DOM nodes their children produced. That distinction is what makes `domNodesOf` and anchor threading necessary.

### The reconciliation algorithm

A general tree-diff is O(n³). React's insight — and ours — is that two heuristics make it O(n) with negligible loss in practice:

1. **Different type ⇒ different tree.** A `<span>` becoming a `<b>` replaces the subtree rather than diffing into it. Cheap, and almost always what the developer meant.
2. **Keys identify children across renders.** Within a parent, children are matched by key before position.

Child reconciliation runs in three passes over `n` children, all O(n):

1. Build a key→instance map of the old children. Unkeyed children get a synthetic `index:i` key, which is exactly why unkeyed lists behave positionally.
2. Unmount every old instance that found no match.
3. Walk the new children **right to left**, patching or mounting each one, threading an _anchor_ (the DOM node this child must precede). Moving right to left means the anchor is always a node that has already been placed correctly, so a single `insertBefore` per moved node is enough — no scratch space, no index bookkeeping.

`ensurePosition` skips the `insertBefore` when a node is already in the right place, so a re-render that changes nothing performs zero DOM mutations.

**Why keys matter, concretely:** prepending one item to an unkeyed list of `n` rows makes every row's index shift, so all `n` rows get their content rewritten. With keys, the `n` existing instances are matched, found to be unchanged, and one node is inserted. That is O(n) prop writes versus one DOM insertion.

### Hooks are positional slots

Each component instance owns a `hooks` array. A module-level cursor is reset before each render, and every hook call claims the next index. That is the whole mechanism — there is no compiler magic and no association between a hook and the variable it is assigned to.

This is precisely why hooks must be called unconditionally and in a stable order. The runtime enforces it rather than trusting it: the hook count is recorded on first render and compared on every subsequent one, and slot kinds are checked, so swapping a `useState` for a `useEffect` throws instead of silently corrupting state.

`useState` stores its value and a setter that is created **once** and closes over its own slot. The setter identity is therefore stable across renders — the property that makes it safe to omit setters from dependency arrays.

### Batching and scheduling

Setting state does not render. It writes to the slot and enqueues the owning instance's `flush` into a `Set`, then schedules one drain on the microtask queue. Three `setState` calls in one event handler therefore produce exactly one re-render, and a `Set` keyed by function identity makes deduplication free.

Work enqueued _during_ a drain is picked up by the same cycle rather than waiting for the next tick, so a state update inside an effect settles before the browser paints.

Effects follow React's passive-effect timing: they are queued during render and flushed after the commit, never during. An effect whose component unmounts before the flush is cancelled rather than run.

### Event delegation

Instead of `addEventListener` per node, handlers are stored in a `WeakMap` keyed by DOM element, and **one** native listener is attached to the root container per event type in use. When it fires, the runtime walks from `event.target` up to the container, invoking registered handlers in order — a synthetic bubble phase.

Three reasons frameworks centralize events this way:

- **Allocation.** A 1000-row table with a click handler per row costs 1000 native listener registrations; delegation costs one.
- **Reconciliation.** Swapping a handler is a map write, not a `removeEventListener`/`addEventListener` pair.
- **Cleanup.** Because the registry is a `WeakMap`, an unmounted element's handler becomes garbage automatically. There is no leak path.

Non-bubbling events (`focus`, `blur`, `mouseenter`, …) are caught in the **capture** phase instead, since capture propagates down to the target even when bubbling does not. `stopPropagation` is intercepted per dispatch so it terminates the synthetic walk, matching what a developer expects from a real listener.

This is roughly React 16's model. React 17 moved delegation from `document` to the root container so that multiple React versions could coexist on a page; we attach at the root container for the same reason.

## Performance notes

- **Mount** is O(n) in tree size; every node must be created once. Children are appended to a detached parent before insertion, so the browser never reflows a partially built element.
- **Update** is O(n) in the number of _rendered_ vnodes, with the constant factor dominated by prop comparison. Unchanged subtrees still cost a walk — this runtime has no `memo` or bailout, which is the single biggest optimization left on the table.
- **DOM writes** are minimized structurally: props are diffed key-by-key, text nodes compare before assigning `nodeValue`, and correctly positioned nodes are never re-inserted.
- **Allocation.** Vnodes are the garbage of any vdom framework, created every render and collected after diffing. They are deliberately monomorphic — `type`, `props`, `key`, always present and in that order — so engines assign one hidden class and keep property access on the diff hot path fast. `children` is omitted rather than set to `[]` for leaf nodes, saving one array allocation per leaf.
- **Bundle size** is 12.1 kB raw, 4.7 kB gzipped for the runtime plus the full example app.

## Limitations

Deliberate, and each one is a known trade rather than an oversight:

- **Rendering is synchronous and non-interruptible.** There is no fiber-style work loop, no time slicing, no priority lanes, no concurrent mode. A large tree blocks the main thread.
- **No `memo`, `useMemo`, or `useCallback`.** Every re-render walks the full subtree below the updating component.
- **Hooks are limited to `useState` and `useEffect`.** No `useRef`, `useReducer`, `useContext`, or `useLayoutEffect`.
- **No error boundaries.** An exception during render propagates to the caller and leaves the tree partially updated.
- **No SSR, hydration, portals, or refs.**
- **Event names are derived by lowercasing** (`onClick` → `click`), so multi-word DOM events that are not simply lowercase are not addressable, and any `on*` function prop is treated as a listener. React uses an explicit event whitelist.
- **The `key` map keeps the first instance** when duplicate keys appear, rather than warning. React warns in development.
- **No synthetic event pooling or normalization.** Handlers receive the native event, with only `stopPropagation` intercepted.

## Possible extensions

Roughly in order of value: `useRef` and `useReducer`; `memo` with prop bailout; error boundaries; a `useContext` implementation threaded through the instance tree; splitting the reconciler's render and commit phases so the render phase becomes interruptible; and a `requestIdleCallback`-driven scheduler with priority lanes.

## Testing

```
npm test
```

Tests mirror the source layout, with one file per module plus integration tests that drive the example app through real DOM events in jsdom. They are written as an executable specification: normalization rules, diffing behaviour, hook ordering, batching semantics, and event propagation are each pinned down by name.

Two of them document behaviour that is _correct but surprising_ — that `0` renders while `false` does not, and that two removals dispatched in the same tick coalesce because both handlers close over the same state. React behaves identically in both cases.
