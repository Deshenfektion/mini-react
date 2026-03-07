# mini-react

A miniature React-like runtime built from scratch in TypeScript. No React dependency — the element model, virtual DOM, reconciler, hooks, event system, and DOM renderer are all implemented here, as an exercise in understanding how component frameworks actually work.

## Status

Under active development. Current progress:

- [x] Element model: `createElement`, virtual node tree, child normalization
- [x] JSX runtime (automatic transform: `jsx`, `jsxs`, `Fragment`)
- [x] DOM renderer (initial mount: host elements, text, fragments, props, listeners)
- [x] Function components (props, children, composition, conditional output)
- [x] Reconciliation (in-place patching, minimal DOM mutations)
- [x] Keyed child reconciliation
- [x] `useState` with batched, scheduled re-renders
- [ ] `useEffect` and lifecycle cleanup
- [ ] Event delegation
- [ ] Examples

## Architecture

The guiding principle is React's own: **UI is a description, not a construction.** Components return cheap immutable objects (virtual nodes) describing what the UI should look like; a separate renderer is responsible for making the real DOM match that description with as few mutations as possible.

```
src/
  core/                element creation, jsx runtime, virtual node model
  dom/                 low-level DOM writes: attributes, properties, styles, listeners
  hooks/               hook dispatcher, slot storage, useState
  scheduler/           microtask batching of pending re-renders
  reconciler/          instance tree, mounting, diffing, unmounting
  renderer/            the public createRoot entry point
  shared/              types, symbols, and JSX type definitions
  jsx-runtime.ts       entry consumed by the automatic JSX transform
  jsx-dev-runtime.ts   dev-transform entry (jsxDEV)
tests/                 mirrors src/, one test file per module
```

TSX works end to end without React: `tsconfig.json` sets `"jsx": "react-jsx"` with `"jsxImportSource": "mini-react"`, and matching path aliases in `tsconfig.json` and `vite.config.ts` resolve `mini-react/jsx-runtime` to this repository's source. The compiler emits `jsx(type, props, key)` calls against our runtime, and our exported `JSX` namespace supplies the types (`JSX.Element`, `IntrinsicElements`, `IntrinsicAttributes`) that make TSX type-check.

### Design decisions so far

- **Text is normalized at creation time.** String and number children become text virtual nodes (`TEXT_ELEMENT`) inside `createElement`, so every layer downstream (renderer, reconciler) operates on a single uniform node shape instead of branching on primitives everywhere.
- **Children are flattened and filtered at creation time.** Nested arrays (the natural output of `list.map(...)`) are flattened, and `null` / `undefined` / booleans are dropped. This is what makes idioms like `cond && <div/>` work, and it means the reconciler can assume a flat array of vnodes.
- **`key` is extracted out of props.** Keys are reconciliation metadata, not data for the component, so they live on the vnode itself — mirroring React's design. The JSX runtime receives `key` as a separate argument (the React 17+ transform contract) and falls back to a `key` found in spread props.
- **One normalization path.** `createElement` (classic) and `jsx`/`jsxs` (automatic transform) both funnel children through the same `normalizeChildren`, so every vnode in the system has an identical shape regardless of how it was authored.
- **The reconciler is split from DOM writes.** `reconciler/` walks trees and decides _what_ changes; `dom/properties.ts` is the only module that knows _how_ a prop lands on a real node (attribute vs. property, style objects, `on*` listeners). This mirrors React's renderer/host-config split, which is what allows React DOM and React Native to share one reconciler.
- **Descriptions and state live in different trees.** VNodes stay immutable; a persistent _instance tree_ (`reconciler/instance.ts`) carries the mutable runtime state: real DOM references, reconciled children, and (soon) hook slots. This is the same separation React draws between elements and fibers.
- **Diffing follows React's O(n) heuristics.** Same type → patch in place (props diffed key-by-key, children reconciled recursively). Different type → replace the whole subtree. Children match by index for now; the keyed algorithm is the next milestone.
- **Hooks are positional slots on the instance, not magic.** Each component instance owns a `hooks` array; every `useState` call claims the next index via a module-level cursor that the reconciler resets before each render. That is the entire mechanism — and it is precisely why hooks must be called unconditionally in the same order. The runtime enforces this by comparing the hook count against the first render and throwing when it changes, which is the honest version of React's dev-mode warning.
- **State updates are batched through a microtask.** `setState` mutates its slot and enqueues the owning instance's `flush`; the scheduler dedupes by identity in a `Set`, so three updates in one event handler produce exactly one re-render. Updates enqueued _during_ a flush drain in the same cycle rather than waiting for the next tick.
- **Fragments and components position themselves with anchors.** Neither owns a DOM node, so mounting and patching thread an _anchor_ (the node their content must precede) through the recursion, and a null-rendering component leaves an empty text node as a stable placeholder. This is what keeps `<Maybe/>` toggling between null and content without disturbing siblings.

## Requirements

- Node.js >= 22

## Scripts

```
npm run dev            start the Vite dev server
npm test               run the test suite once
npm run test:watch     run tests in watch mode
npm run test:coverage  run tests with coverage
npm run typecheck      type-check without emitting
npm run lint           lint with ESLint
npm run format         format with Prettier
```
